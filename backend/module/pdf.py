"""
PDFを色々取り扱うマン
"""
import tempfile
import os
from markitdown import MarkItDown
from pdf2image import convert_from_path, convert_from_bytes
import fitz
from io import BytesIO
import base64
from fastapi.middleware.cors import CORSMiddleware
from langchain_core.language_models.chat_models import BaseChatModel
from typing import *

async def handle_pdf(file: BinaryIO, chat_model:Optional[BaseChatModel]):
    md = MarkItDown(
        enable_plugins=False,
        llm_client=chat_model,
    )

    # 一時ファイルにPDF保存
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp_pdf:
        pdf_content = await file.read()
        tmp_pdf.write(pdf_content)
        tmp_pdf_path = tmp_pdf.name

    # PDF → ページごとに画像へ変換
    images = convert_from_bytes(pdf_content)
    images_b64 = []
    for img in images:
        buffer = BytesIO()
        img.save(buffer, format="PNG")  # PNGに変換
        img_bytes = buffer.getvalue()
        img_b64 = base64.b64encode(img_bytes).decode("utf-8")
        images_b64.append(img_b64)

    # 各PDFページにPDF保存

    doc = fitz.open(tmp_pdf_path)
    page_paths = []

    # 2. 各ページを個別のPDFに保存
    for page_num in range(len(doc)):
        single_page = fitz.open()  # 新しい空PDF
        single_page.insert_pdf(doc, from_page=page_num, to_page=page_num)

        page_file = tempfile.NamedTemporaryFile(delete=False, suffix=f"_page_{page_num+1}.pdf")
        single_page.save(page_file.name)
        single_page.close()

        page_paths.append(page_file.name)

    doc.close()

    # PDFページ毎に文字起こし
    page_contents = []
    for page_path in page_paths:
        page_content = md.convert(page_path)
        page_contents.append(page_content.text_content)


    # 一時ファイル削除
    os.remove(tmp_pdf_path)
    for p in page_paths:
        os.remove(p)

    data = [{"image":i,"text":t} for i,t in zip(images_b64,page_contents)]
    #print(data)
    return  data