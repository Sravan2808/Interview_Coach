import os

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from routers.interview import router as interview_router
from routers.report import router as report_router

app = FastAPI(title="AI Interview Coach API")

frontend_url_setting = os.getenv("FRONTEND_URL", "").strip()
allowed_origins = [
    origin.strip().rstrip("/")
    for origin in frontend_url_setting.split(",")
    if origin.strip()
] or ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(interview_router, prefix="/api/interview", tags=["interview"])
app.include_router(report_router, prefix="/api/report", tags=["report"])


@app.exception_handler(Exception)
async def unhandled_exception_handler(_request: Request, _exception: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": "An unexpected error occurred. Please try again."},
    )


@app.on_event("startup")
async def announce_startup():
    print("AI Interview Coach API started successfully")


@app.get("/")
def read_root():
    return {"message": "AI Interview Coach API is healthy"}
