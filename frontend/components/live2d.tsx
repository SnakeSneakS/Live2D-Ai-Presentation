"use client";
import React, { SetStateAction, useEffect, useState } from 'react';
import { text2speech } from './speach';
import { Live2DModel } from 'pixi-live2d-display-lipsyncpatch';

export const LoadLive2DCore: React.FC<{
    loaded: boolean,
    setLoaded: React.Dispatch<SetStateAction<boolean>>
}> = ({
    loaded, setLoaded
}) => {

        useEffect(() => {
            const loadCubismCore = async () => {
                if (window.Live2DCubismCore) {
                    console.log('Live2DCubismCore is already loaded.');
                    return;
                }

                try {
                    let cnt = 0;
                    // 動的にスクリプトをロード
                    for (let src of ['/lib/CubismSdkForWeb-5-r.4/Core/live2dcubismcore.min.js', '/lib/live2d/live2d.min.js']) {
                        const script = document.createElement('script');
                        script.src = src;
                        script.onload = () => {
                            console.log('Live2DCubismCore loaded successfully.');
                            cnt += 1;
                            if (cnt == 2) {
                                setLoaded(true)
                            }
                        }
                        script.onerror = () => console.error('Failed to load Live2DCubismCore.');
                        document.head.appendChild(script);
                    }

                } catch (error) {
                    console.error('Error loading Live2DCubismCore:', error);
                }
            };

            if (!loaded) loadCubismCore();
        }, []);

        return <>{
            !loaded ?
                <div>Live2D is loading...</div>
                : <div>{/*live2D loaded!*/}</div>
        }
        </>
    };

export class ModelHandler {
    __model
    constructor(__model: Live2DModel) {
        if (!__model) throw Error("model not found...")
        this.__model = __model
    }

    say = (text: string) => {
        if (!this.__model) console.error("model not found!")
        text2speech(text, 3).then((soundPath) => {
            this.__model.stopSpeaking()
            //this.__model.motion('tap_body', undefined, undefined, { sound: soundPath, crossOrigin: "anonymous" });
            this.__model.speak(soundPath)
        })
        return
    }
    motion = (motion: string) => {
        if (!this.__model) console.error("model not found!")
        this.__model.stopMotions()
        this.__model.motion(motion)
        return
    }
    expression = (expression: string) => {
        if (!this.__model) console.error("model not found!")
        this.__model.expression(expression)
        return
    }

}

export default LoadLive2DCore;
