import { useEffect, useState } from "react";

const AskInputForm: React.FC<{
    windowWidth: number,
    windowHeight: number,
}> = ({
    windowWidth, windowHeight
}) => {

        const [inputText, setInputText] = useState(''); // 入力されたテキストを保持
        const [response, setResponse] = useState(null); // ボットの返答を保持
        const [loading, setLoading] = useState(false); // APIリクエストのローディング状態を保持
        const [error, setError] = useState<string | null>(null); // エラー状態を保持


        useEffect(() => {
            if (error) alert(`error: ${error}`)
        }, [error])
        // 入力エリアの変更を処理
        const handleInputChange: React.ChangeEventHandler<HTMLTextAreaElement> = (e) => {
            setInputText(e.target.value);
        };

        // 送信ボタンのクリック時の処理
        const handleSubmit = async () => {
            if (inputText.trim() === "") {
                alert("入力をしてください！");
                return;
            }

            setLoading(true);
            setError(null); // 以前のエラーをクリア

            try {
                const data = await askRequest(inputText)
                setResponse(data.response); // ボットの返答を設定
            } catch (error) {
                setError('通信エラーが発生しました');
            } finally {
                setLoading(false); // ローディング状態を解除
            }
        };

        return (
            <div style={{ padding: '20px' }}>
                <textarea
                    id="inputArea"
                    style={{ width: '100%', height: `${windowHeight - 100}px` }}
                    value={inputText}
                    onChange={handleInputChange}
                    placeholder="ここに入力..."
                />
                <div style={{ marginTop: '10px' }}>
                    <button
                        style={{ padding: '5px 10px' }}
                        onClick={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? '送信中...' : '送信'}
                    </button>
                </div>

                {error && <div style={{ color: 'red', marginTop: '10px' }}>{error}</div>}
                {response && (
                    <div style={{ marginTop: '10px' }}>
                        <strong>返答:</strong>
                        <p>{response}</p>
                    </div>
                )}
            </div>
        );
    };
