from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/chat", tags=["chat"])

class ChatRequest(BaseModel):
    message: str
    lang: str = "en"

RULES = {
    "subsidy": "Under PM Surya Ghar, you can get a subsidy of up to ₹78,000 depending on your system capacity.",
    "capacity": "Your recommended capacity is based on your monthly electricity consumption and available roof area.",
    "save": "Most residential users save between ₹40,000–₹55,000 per year after installing solar.",
    "battery": "A battery is optional — it's recommended if you experience frequent power cuts or want backup power.",
    "payback": "The typical payback period for a residential system is 4–5 years.",
}

@router.post("/")
def chat(payload: ChatRequest):
    text = payload.message.lower()
    for keyword, response in RULES.items():
        if keyword in text:
            return {"reply": response}
    return {"reply": "I can help with subsidy, system capacity, savings, battery, and payback questions. Could you rephrase your question?"}
