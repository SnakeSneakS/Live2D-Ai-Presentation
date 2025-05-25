"use client";

import { useEffect, useRef, useState } from 'react';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import { text2speech } from '@/components/speach';
import { LoadLive2DCore, ModelHandler } from '@/components/live2d';
import * as PIXI from 'pixi.js';
import PdfUploader from '@/components/pdf';

const base64ImagePath = (base64Data: string) => {
  return `data:image/png;base64,${base64Data}`;
}

interface SlideData {
  slideBase64: string;
  slideText: string;
  manuscript: string;
}

const Live2DPresenter = () => {
  const [model, setModel] = useState<any>()
  const [modelHandler, setModelHandler] = useState<ModelHandler | null>(null);
  const [cubismLoaded, cubismSetLoaded] = useState(false);


  const modelPath = "/data/source/Live2D_VTubeStudioずんだもん/Zundamon_vts/zundamon.model3.json";
  //"/data/source/Live2D_VTubeStudioずんだもん/Zundamon_vts/zundamon.model3.json"
  //"https://cdn.jsdelivr.net/gh/guansss/pixi-live2d-display/test/assets/shizuku/shizuku.model.json";
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const controlRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  //const initializedRef = useRef(false);
  const slideSpriteRef = useRef<any>(null);
  const [slides, setSlides] = useState<SlideData[]>([]);


  const [currentIndex, setCurrentIndex] = useState(0);



  useEffect(() => {
    if (model) {
      setModelHandler(new ModelHandler(model))
      console.debug(model._emotions)
    }
  }, [model])

  useEffect(() => {
    if (window) {
      (window as any).PIXI = PIXI;
    }
  }, [])


  /*
  // ローカルのものを利用する
  useEffect(() => {
    fetch('/data/presentation/data.json')
      .then(res => {
        res.json().then((data)=>{
          //console.debug("data: ",data);
          if (Array.isArray(data)){
            setSlides(data as Array<SlideData>)
          }
        })
      })
      .catch(console.error);
  }, []);
  */

  useEffect(() => {
    const loadAll = async () => {

      if (!canvasRef.current || !window.Live2DCubismCore) return;
      const { Live2DModel: Live2DModelDefault } = await import('pixi-live2d-display-lipsyncpatch');
      class Live2DModel extends Live2DModelDefault {
        _expressions: any;
        constructor(...args: any[]) {
          super(...args);
          this._expressions = [];
        }
      }

      //initializedRef.current = true;

      //const PIXI = (window as any).PIXI;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const app = new PIXI.Application({
        view: canvas,
        autoStart: true,
        resizeTo: window,
        backgroundAlpha: 0,
      });


      // スライド画像表示
      class Sprite extends PIXI.Sprite {
        tag: string
        constructor(...args: any[]) {
          super(...args);
          this.tag = "";
        }
      }
      if(slides.length>0){
        const slideImagePath = slides.length>0? base64ImagePath(slides[0].slideBase64):base64ImagePath("");
        const slideSprite = Sprite.from(slideImagePath) as Sprite;
        slideSprite.interactive = true;
        //slideSprite.buttonMode = true;
        slideSprite.anchor.set(0.5, 0.5);
        slideSprite.position.set(app.renderer.width / 2, app.renderer.height / 2); // モデルを画面中央に配置
        slideSprite.alpha = 1.0;
        slideSprite.scale.set(0.3); // 初期サイズ調整
        slideSprite.tag = `slide`
        app.stage.addChild(slideSprite);
        draggable(slideSprite);
        resizable(slideSprite);
        slideSpriteRef.current = slideSprite;
      }



      // Live2D モデル読み込み
      if(!model){
        const _model = await Live2DModel.from(modelPath);
        _model.anchor.set(0.5, 0.5);
        _model.scale.set(0.1)
        _model.position.set(app.renderer.width / 2, app.renderer.height / 2); // モデルを画面中央に配置
        fetch(modelPath).then((r) => {
          r.json().then((d) => {
            _model._expressions = (d.FileReferences.Expressions as Array<any>).map((e) => e.Name)
            //console.debug("expressions: ", model._expressions)
          })
        })
        resizable(_model);
        draggable(_model);
        setModel(_model)
        _model.on("hit", (hitAreas: string[]) => {
          if (hitAreas.includes("body")) model.motion("tap_body");
          else if (hitAreas.includes("head")) model.expression();
          else model.expression();
        });
      }else{
        app.stage.addChild(model);
      }
      //model.x = (innerWidth - model.width) / 2;


      // ドラッグ可能にする関数
      function draggable(displayObject: any) {
        displayObject.interactive = true;
        displayObject.buttonMode = true;

        displayObject.on("pointerdown", (e: any) => {
          displayObject._dragging = true;
          displayObject._pointerX = e.data.global.x - displayObject.x;
          displayObject._pointerY = e.data.global.y - displayObject.y;
        });

        displayObject.on("pointermove", (e: any) => {
          if (displayObject._dragging) {
            displayObject.x = e.data.global.x - displayObject._pointerX;
            displayObject.y = e.data.global.y - displayObject._pointerY;
          }
        });

        displayObject.on("pointerup", () => (displayObject._dragging = false));
        displayObject.on("pointerupoutside", () => (displayObject._dragging = false));
      }

      // リサイズスライダー
      function resizable(model: any) {
        //console.debug(model)
        let id = `modelscale-${model.tag}`;
        let slider = document.getElementById(id) as HTMLInputElement;

        if (!slider) {
          const p = document.createElement("p");
          const label = document.createElement("label");
          label.setAttribute("for", id);
          label.textContent = `Model Scale (for ${id}): `;

          slider = document.createElement("input");
          slider.type = "range";
          slider.id = id;
          slider.min = "0.05";
          slider.max = "1.0";
          slider.step = "0.01";
          slider.value = model.scale.x.toFixed(2);
          slider.style.width = "150px";

          p.appendChild(label);
          p.appendChild(slider);
          controlRef.current?.appendChild(p);
        }

        slider.addEventListener("input", () => {
          const value = parseFloat(slider.value);
          model.scale.set(value);
        });

        model.scale.set(parseFloat(slider.value));
      }
    };

    loadAll();
  }, [slides, canvasRef, cubismLoaded]);



  const handlePrev = () => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      updateSlideImage(newIndex);
    }
  };

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      updateSlideImage(newIndex);
    }
  };

  const updateSlideImage = (index: number) => {
    const sprite = slideSpriteRef.current;
    if (sprite && slides[index]) {
      const newTexture = (window as any).PIXI.Texture.from(base64ImagePath(slides[index].slideBase64));
      sprite.texture = newTexture;
    }
  };

  /*
  const handlePlayAudio = () => {
    const audio = audioRef.current;
    const audioSrc = `/data/presentation/source/${slides[currentIndex]?.audio}`;
    if (audio) {
      audio.src = audioSrc;
      audio.play();
    }
  };

  
  */
  /*
  const newWindowForAskInputForm = () => {
    const currentWindowWidth = window.innerWidth || 300;
    const currentWindowHeight = window.innerHeight || 200;
    const newWindowWidth = currentWindowWidth;
    const newWindowHeight = 200;
    const currentWindowX = window.screenX || window.screenLeft || 0;
    const currentWindowY = window.screenY || window.screenTop || 0;
    const newWindowX = currentWindowX; //- newWindowWidth;
    const newWindowY = currentWindowY + currentWindowHeight;
    console.debug("window: ", currentWindowX, newWindowX)

    // 新しいウィンドウを開く
    const newWindow = window.open(
        '', // 空白のURL
        '_blank', // 新しいウィンドウを開く
        `width=${newWindowWidth},height=${newWindowHeight},top=${newWindowY},left=${newWindowX}` // ウィンドウの位置とサイズを指定
    );

    // 新しいウィンドウのコンテンツを設定
    if (newWindow) {
        newWindow.document.title = '入力フォーム'; // ウィンドウのタイトル
        newWindow.document.body.innerHTML = "";
        const div = newWindow.document.createElement('div');
        newWindow.document.body.appendChild(div);
        const root = ReactDOM.createRoot(div)
        root.render(<AskInputForm windowWidth={newWindowWidth} windowHeight={newWindowHeight} />);
    }
};
  */

  return (
    <div style={{ width: '95vw', margin: '0 auto', display: "flex", justifyContent: 'center', flexDirection: 'column', }}>
      <LoadLive2DCore loaded={cubismLoaded} setLoaded={cubismSetLoaded} />

      <Head>
        <title>Live2D Slide Presenter</title>
      </Head>
      <canvas ref={canvasRef} id="canvas" style={{ width: '92vw', height: '69vw', border: '2px solid gray' }} />

      <div
        ref={controlRef}
        id="control"
        style={{ top: 10, left: 10, zIndex: 20, padding: '10px' }}
      >
        <h3>操作パネル:</h3>
        <div>
          <button onClick={handlePrev}>前のスライド</button>
          <button onClick={handleNext}>次のスライド</button>
          <button onClick={() => {
            modelHandler?.say(slides[currentIndex].manuscript)
          }
            /*handlePlayAudio*/
          }>音声再生</button>
        </div>
        <div>
          <input id="say_text_id" type="text"></input>
          <button onClick={() => {
            if (modelHandler) {
              let say_text = (document.getElementById("say_text_id") as HTMLInputElement)?.value;
              modelHandler.say(`${say_text}`)
            }
          }}>speak</button>
        </div>
        <div>
          <h4>expressions</h4>
          <select id="emotion_select_id">
            {model?._expressions?.map((emotion: string, index: number) => (
              <option key={index} value={emotion}>
                {emotion}
              </option>
            ))}
          </select>
          <button
            onClick={() => {
              if (modelHandler) {
                const select = document.getElementById("emotion_select_id") as HTMLSelectElement;
                const selectedEmotion = select?.value;
                modelHandler.expression(selectedEmotion);
              }
            }}
          >
            emote
          </button>
        </div></div>
      <div>
        <PdfUploader
          slides={slides.map((m) => {
            return {
              slideBase64: m.slideBase64,
              slideText: m.slideText,
            }
          })}
          onUploadedSlides={(slidesAdded) => {
            if(slidesAdded.length==0) return;
            fetch("http://localhost:8000/create_manuscripts", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                "slide_texts": slidesAdded.map((m)=>m.slideText),
                "expression_types": model._expressions,
              }),
            })
            .then((res)=>res.json())
            .then((data)=>{
              setSlides((prev) => {
                return [...slidesAdded.map((s,i) => {
                  return {
                    slideBase64: s.slideBase64,
                    slideText: s.slideText,
                    manuscript: (data as Array<string>)[i],
                  }
                })]
              })
            })
            
          }}
        />
      </div>
      <div>
        <audio ref={audioRef} />
      </div>
    </div>
  );
};

export default dynamic(() => Promise.resolve(Live2DPresenter), { ssr: false });
