from fastapi import APIRouter

from app.modules.chat.router import router as chat_router
from app.orchestration.router import router as campaigns_router

router = APIRouter()
router.include_router(chat_router)
router.include_router(campaigns_router)
