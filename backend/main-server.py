from fastapi import FastAPI, UploadFile, File, Body
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from langchain_openai import ChatOpenAI
from module.pdf import handle_pdf
from module.manuscript import create_manuscript
from typing import *
from pydantic import BaseModel

chat_model_name = "gpt-4o-mini"
chat_model = ChatOpenAI(name=chat_model_name)

app = FastAPI(
    title="PDF Split & OCR API", 
    description="Upload a PDF and get per-page OCR results", 
    version="1.0.0",
    docs_url="/",            
)
# CORS設定を追加
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],        # すべてのオリジンを許可
    allow_credentials=True,
    allow_methods=["*"],        # すべてのHTTPメソッドを許可
    allow_headers=["*"],        # すべてのヘッダーを許可
)

@app.post("/upload-pdf")
async def upload_pdf(file: UploadFile):
    try:
        return await handle_pdf(file=file, chat_model=chat_model)
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})
    
class ManuscriptRequest(BaseModel):
    slide_texts: List[str]
    expression_types: List[str] = Body(default=[])
@app.post("/create_manuscripts")
async def upload_pdf(req: ManuscriptRequest):
    try:
        return await create_manuscript(chat_model=chat_model, slide_texts=req.slide_texts, expression_types=req.expression_types)
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})
    


if __name__=="__main__":
    print("Run this program using univcorn")

