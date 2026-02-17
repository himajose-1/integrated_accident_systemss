from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from pydantic import BaseModel
from typing import Optional, List
from sqlalchemy.orm import Session
from datetime import datetime
from models.database import get_db, AccidentReport
from services.member3_realtime import realtime_service
from models.database import TrafficReport
from sqlalchemy import and_
from datetime import timedelta
import os
import json
from pathlib import Path
import uuid

router = APIRouter(prefix="/api/reports", tags=["Accident Reporting"])

class AccidentReportCreate(BaseModel):
    latitude: float
    longitude: float
    severity: str  # Minor, Major, Fatal
    description: Optional[str] = None
    weather: Optional[str] = "Clear"
    road_condition: Optional[str] = "Dry"
    vehicle_type: Optional[str] = "Car"
    speed: Optional[float] = None
    time_of_day: Optional[str] = None
    traffic_density: Optional[str] = "Medium"

class AccidentReportUpdate(BaseModel):
    verified: Optional[bool] = None
    description: Optional[str] = None


class TrafficReportCreate(BaseModel):
    latitude: float
    longitude: float
    road: Optional[str] = "Unknown Road"
    severity: Optional[str] = "moderate"
    description: Optional[str] = None


@router.post("/")
async def create_accident_report(report: AccidentReportCreate, db: Session = Depends(get_db)):
    """
    Submit a new accident report
    
    Creates report in database and broadcasts to connected clients
    """
    try:
        # Determine time of day if not provided
        if not report.time_of_day:
            current_hour = datetime.utcnow().hour
            if 6 <= current_hour < 12:
                time_of_day = "Morning"
            elif 12 <= current_hour < 17:
                time_of_day = "Afternoon"
            elif 17 <= current_hour < 21:
                time_of_day = "Evening"
            else:
                time_of_day = "Night"
        else:
            time_of_day = report.time_of_day
        
        # Create database record
        db_report = AccidentReport(
            latitude=report.latitude,
            longitude=report.longitude,
            severity=report.severity,
            description=report.description,
            weather=report.weather,
            road_condition=report.road_condition,
            vehicle_type=report.vehicle_type,
            speed=report.speed,
            time_of_day=time_of_day,
            traffic_density=report.traffic_density,
            reported_at=datetime.utcnow(),
            verified=False
        )
        
        db.add(db_report)
        db.commit()
        db.refresh(db_report)
        
        # Convert to dict for broadcasting
        report_dict = {
            "id": db_report.id,
            "latitude": db_report.latitude,
            "longitude": db_report.longitude,
            "severity": db_report.severity,
            "description": db_report.description,
            "weather": db_report.weather,
            "road_condition": db_report.road_condition,
            "vehicle_type": db_report.vehicle_type,
            "reported_at": db_report.reported_at.isoformat(),
            "verified": db_report.verified
        }
        
        # Broadcast to connected clients
        await realtime_service.broadcast_accident_report(report_dict)
        
        # Create alert for the accident
        severity_map = {"Minor": "medium", "Major": "high", "Fatal": "critical"}
        await realtime_service.create_alert({
            "type": "accident",
            "severity": severity_map.get(report.severity, "medium"),
            "latitude": report.latitude,
            "longitude": report.longitude,
            "message": f"{report.severity} accident reported",
            "radius_km": 5,
            "duration_minutes": 120
        })
        
        return {
            "success": True,
            "data": report_dict,
            "message": "Accident report submitted successfully"
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create report: {str(e)}")


@router.post('/traffic')
async def create_traffic_report(report: TrafficReportCreate, db: Session = Depends(get_db)):
    """Create a traffic report visible to all users for 2 hours"""
    try:
        now = datetime.utcnow()
        expires_at = now + timedelta(hours=2)

        db_report = TrafficReport(
            latitude=report.latitude,
            longitude=report.longitude,
            road=report.road,
            severity=report.severity,
            description=report.description,
            reported_at=now,
            expires_at=expires_at
        )
        db.add(db_report)
        db.commit()
        db.refresh(db_report)

        # Broadcast traffic alert to clients
        await realtime_service.create_alert({
            'type': 'traffic',
            'severity': 'high' if report.severity == 'heavy' else 'medium',
            'latitude': report.latitude,
            'longitude': report.longitude,
            'message': f"Traffic reported on {report.road}",
            'radius_km': 5,
            'duration_minutes': 120
        })

        return { 'success': True, 'data': { 'id': db_report.id }, 'message': 'Traffic report created' }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create traffic report: {str(e)}")


@router.get('/traffic')
async def get_active_traffic_reports(db: Session = Depends(get_db)):
    """Return active traffic reports (not expired)"""
    try:
        now = datetime.utcnow()
        reports = db.query(TrafficReport).filter(TrafficReport.expires_at > now).all()
        return {
            'success': True,
            'data': {
                'count': len(reports),
                'reports': [
                    {
                        'id': r.id,
                        'latitude': r.latitude,
                        'longitude': r.longitude,
                        'road': r.road,
                        'severity': r.severity,
                        'description': r.description,
                        'reported_at': r.reported_at.isoformat(),
                        'expires_at': r.expires_at.isoformat()
                    }
                    for r in reports
                ]
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch traffic reports: {str(e)}")

@router.get("/")
async def get_accident_reports(
    limit: int = 100,
    severity: Optional[str] = None,
    verified: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    """Get accident reports with optional filters"""
    try:
        query = db.query(AccidentReport)
        
        if severity:
            query = query.filter(AccidentReport.severity == severity)
        
        if verified is not None:
            query = query.filter(AccidentReport.verified == verified)
        
        reports = query.order_by(AccidentReport.reported_at.desc()).limit(limit).all()
        
        return {
            "success": True,
            "data": {
                "count": len(reports),
                "reports": [
                    {
                        "id": r.id,
                        "latitude": r.latitude,
                        "longitude": r.longitude,
                        "severity": r.severity,
                        "description": r.description,
                        "weather": r.weather,
                        "road_condition": r.road_condition,
                        "vehicle_type": r.vehicle_type,
                        "speed": r.speed,
                        "time_of_day": r.time_of_day,
                        "traffic_density": r.traffic_density,
                        "reported_at": r.reported_at.isoformat(),
                        "verified": r.verified,
                        "evidence_files": json.loads(r.evidence_files) if r.evidence_files else []
                    }
                    for r in reports
                ]
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch reports: {str(e)}")

@router.get("/{report_id}")
async def get_accident_report(report_id: int, db: Session = Depends(get_db)):
    """Get a specific accident report"""
    try:
        report = db.query(AccidentReport).filter(AccidentReport.id == report_id).first()
        
        if not report:
            raise HTTPException(status_code=404, detail="Report not found")
        
        return {
            "success": True,
            "data": {
                "id": report.id,
                "latitude": report.latitude,
                "longitude": report.longitude,
                "severity": report.severity,
                "description": report.description,
                "weather": report.weather,
                "road_condition": report.road_condition,
                "vehicle_type": report.vehicle_type,
                "speed": report.speed,
                "time_of_day": report.time_of_day,
                "traffic_density": report.traffic_density,
                "reported_at": report.reported_at.isoformat(),
                "verified": report.verified,
                "evidence_files": json.loads(report.evidence_files) if report.evidence_files else []
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch report: {str(e)}")

@router.patch("/{report_id}")
async def update_accident_report(
    report_id: int,
    update: AccidentReportUpdate,
    db: Session = Depends(get_db)
):
    """Update an accident report (e.g., verify it)"""
    try:
        report = db.query(AccidentReport).filter(AccidentReport.id == report_id).first()
        
        if not report:
            raise HTTPException(status_code=404, detail="Report not found")
        
        if update.verified is not None:
            report.verified = update.verified
        
        if update.description is not None:
            report.description = update.description
        
        db.commit()
        db.refresh(report)
        
        return {
            "success": True,
            "data": {
                "id": report.id,
                "verified": report.verified,
                "description": report.description,
                "evidence_files": json.loads(report.evidence_files) if report.evidence_files else []
            },
            "message": "Report updated successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update report: {str(e)}")

@router.delete("/{report_id}")
async def delete_accident_report(report_id: int, db: Session = Depends(get_db)):
    """Delete an accident report and associated media files"""
    try:
        report = db.query(AccidentReport).filter(AccidentReport.id == report_id).first()
        
        if not report:
            raise HTTPException(status_code=404, detail="Report not found")
        
        # Delete associated media files
        if report.evidence_files:
            try:
                evidence_list = json.loads(report.evidence_files)
                for evidence in evidence_list:
                    filename = evidence.get("filename")
                    if filename:
                        file_path = Path(__file__).parent.parent / "media" / "evidence" / filename
                        if file_path.exists():
                            file_path.unlink()
            except json.JSONDecodeError:
                pass  # If JSON is invalid, just skip file deletion
        
        db.delete(report)
        db.commit()
        
        return {
            "success": True,
            "message": "Report and associated media files deleted successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete report: {str(e)}")


# ==================== IMAGE/EVIDENCE UPLOAD ====================

# Create media upload directory if it doesn't exist
MEDIA_DIR = Path("media/evidence")
MEDIA_DIR.mkdir(parents=True, exist_ok=True)

@router.post("/{report_id}/upload-media")
async def upload_media(
    report_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Upload evidence/media file for a report"""
    try:
        # Get the report
        report = db.query(AccidentReport).filter(AccidentReport.id == report_id).first()
        
        if not report:
            raise HTTPException(status_code=404, detail="Report not found")
        
        # Validate file extension
        allowed_extensions = {'jpg', 'jpeg', 'png', 'gif', 'mp4', 'mov', 'avi', 'webm'}
        file_ext = file.filename.split('.')[-1].lower()
        
        if file_ext not in allowed_extensions:
            raise HTTPException(status_code=400, detail=f"File type not allowed. Allowed: {allowed_extensions}")
        
        # Generate unique filename
        unique_name = f"{report_id}_{uuid.uuid4().hex}.{file_ext}"
        file_path = MEDIA_DIR / unique_name
        
        # Save file
        content = await file.read()
        with open(file_path, 'wb') as f:
            f.write(content)
        
        # Update report with evidence file path
        evidence_files = []
        if report.evidence_files:
            try:
                evidence_files = json.loads(report.evidence_files)
            except:
                evidence_files = []
        
        evidence_files.append({
            'filename': unique_name,
            'original_name': file.filename,
            'uploaded_at': datetime.utcnow().isoformat(),
            'file_type': file_ext,
            'url': f"/api/reports/{report_id}/media/{unique_name}"
        })
        
        report.evidence_files = json.dumps(evidence_files)
        db.commit()
        db.refresh(report)
        
        return {
            "success": True,
            "data": {
                "filename": unique_name,
                "url": f"/api/reports/{report_id}/media/{unique_name}",
                "file_type": file_ext
            },
            "message": "Media uploaded successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to upload media: {str(e)}")


@router.get("/{report_id}/media/{filename}")
async def get_media(report_id: int, filename: str):
    """Retrieve evidence/media file for a report"""
    try:
        file_path = MEDIA_DIR / filename
        
        if not file_path.exists():
            raise HTTPException(status_code=404, detail="Media file not found")
        
        # Verify the file belongs to this report
        if not filename.startswith(f"{report_id}_"):
            raise HTTPException(status_code=403, detail="Access denied")
        
        from fastapi.responses import FileResponse
        return FileResponse(file_path)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve media: {str(e)}")


@router.get("/{report_id}/evidence")
async def get_evidence(report_id: int, db: Session = Depends(get_db)):
    """Get all evidence files for a report"""
    try:
        report = db.query(AccidentReport).filter(AccidentReport.id == report_id).first()
        
        if not report:
            raise HTTPException(status_code=404, detail="Report not found")
        
        evidence_files = []
        if report.evidence_files:
            try:
                evidence_files = json.loads(report.evidence_files)
            except:
                evidence_files = []
        
        return {
            "success": True,
            "data": {
                "report_id": report_id,
                "evidence_count": len(evidence_files),
                "files": evidence_files
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch evidence: {str(e)}")