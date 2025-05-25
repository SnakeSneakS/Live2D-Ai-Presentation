"""
発表原稿を色々取り扱うマン
"""

from typing import *
from langchain_core.language_models.chat_models import BaseChatModel
import asyncio

async def create_manuscript(chat_model:BaseChatModel, slide_texts:List[str], expression_types: List[str]=[]):
    summary_of_slide_prompt = "\n".join([
        "<slide_text>",
        "\n---\n".join([f"page {i}:\n{t[:min(len(t),10000/len(slide_texts))]}" for i,t in enumerate(slide_texts)]),
        "</slide_text>",
        "<instruction>",
        f"Please generate a summary of given slide_text. Answer only the summary,",
        "</instruction>",
    ])
    summary_of_slide = chat_model.invoke(summary_of_slide_prompt).content

    async def create_manuscript_per_slide(i:int,t:str,summary_of_slide:str,expression_types:List[str]=[]):
        if t=="":
            return ""
        slide_manuscript_prompt = "\n".join([
            "<summary_of_slides>",
            summary_of_slide,
            "</summary_of_slides>",
            "<slide_text>",
            f"page {i}:\n{t}"
            "</slide_text>",
            "<expression_types>",
            f"{expression_types}",
            "</expression_types>",
            "<instruction>",
            "あなたはプロの発表原稿作成者です。",
            f"suumary_of_slidesのようなスライドを発表しています。",
            f"そこで、特にslide_textスライド（他のページについては別で聞いています。例えば0ページ目では挨拶をして、3ページ目では詳細説明をするなど。スライドに合わせて。）の発表原稿として、実際にどのような内容で喋るか、原稿を考えてください。特に一文があまり長くならないようにしつつ、一文ごとに改行して下さい。",
            f"その際、expression_typesの情報を使って、expressionの指示を@emote(ExpressionType)の形で形で支持して下さい。これについても改行して下さい。",
            "以上のように、このスライドにおける発表原稿を生成してください。その際、英字などに対しては英字ではなく「読み方」を書いてください。(ここで生成された文章を元に発表音声が自動的に作成されます。)",
            "答えだけ教えて下さい。",
            "</instruction>",
            "<example>",
            f"おはようございます。",
            "@emote(Smile)",
            "なかなかうまくいきません...",
            "@emote(Sad)",
            "仕方ないですね、",
            "@emote(Normal)",
            "</example>",
        ])
        slide_manuscript = chat_model.invoke(slide_manuscript_prompt).content
        return slide_manuscript

    slide_manuscripts = await asyncio.gather(*[
        create_manuscript_per_slide(i, t, summary_of_slide, expression_types)
        for i, t in enumerate(slide_texts)
    ])
    return slide_manuscripts
