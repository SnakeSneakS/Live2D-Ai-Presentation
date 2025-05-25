//voicevoxを使って音声生成を行う
//ref: https://voicevox.hiroshiba.jp/
//0: XXX
//X: whiteCUL クレジット表記必要
//X: ナースロボ＿タイプＴ 冷静で慎み深い声 クレジット表記必要 47-50
//X: 春歌ナナ ロリボイス
//X: 猫使ビィ ピュアであどけない声
//X: ロボットボイス Voidoll 慎ましやかで電子的な声
export async function text2speech(text: string, speaker: number = 48): Promise<string> {
    const baseUrl = "http://localhost:50021"; // VoiceVoxエンジンのURL
    try {
        // 1. AudioQueryリクエスト: テキストを音声合成用のクエリデータに変換
        const audioQueryResponse = await fetch(`${baseUrl}/audio_query?text=${encodeURIComponent(text)}&speaker=${speaker}`, {
            method: "POST",
        });
        if (!audioQueryResponse.ok) {
            throw new Error("Failed to fetch audio query");
        }
        const audioQuery = await audioQueryResponse.json();

        //change speed
        //audioQuery.pitchScale = 0;
        //audioQuery.speedScale = 1;
        //audioQuery.intonationScale = 1;

        // 2. Synthesisリクエスト: 音声データを生成
        const synthesisResponse = await fetch(`${baseUrl}/synthesis?speaker=${speaker}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(audioQuery),
        });
        if (!synthesisResponse.ok) {
            throw new Error("Failed to synthesize audio");
        }
        const audioBlob = await synthesisResponse.blob();

        // 3. Blob URLを生成して返す
        const audioUrl = URL.createObjectURL(audioBlob);
        return audioUrl;
    } catch (error) {
        console.error("Error in text-to-speech process:", error);
        throw error;
    }
}
