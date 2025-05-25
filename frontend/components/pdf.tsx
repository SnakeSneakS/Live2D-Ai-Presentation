"use client";

import { Dispatch, FC, SetStateAction, useState } from "react";

export interface SlidePage{
  slideBase64: string,
  slideText: string,
}
export type Slides = SlidePage[]

type slideFunc = (slides: Slides) => void;
export interface PdfUploaderProps {
  slides: Slides,
  onUploadedSlides: null | slideFunc,
}

export const PdfUploader: FC<PdfUploaderProps> = ({
  slides,onUploadedSlides,
}) => {


  const [expand, setExpand] = useState(true)
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      setFile(e.target.files[0]);
      onUploadedSlides?.([]);
      setError(null);
    }
  };


  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("http://localhost:8000/upload-pdf", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`Error: ${res.status}`);
      }

      const resData = await res.json() as {image:string,text:string}[];
      const slideData: Slides = (resData.map((m)=>{
        return {slideBase64: m.image, slideText: m.text}
      }) as Slides);
      onUploadedSlides?.(slideData)
    } catch (err: any) {
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>PDF Upload & OCR</h2>
      <input type="file" accept="application/pdf" onChange={handleFileChange} />
      <button onClick={handleUpload} disabled={!file || loading} style={{ marginLeft: 10 }}>
        {loading ? "Uploading..." : "Upload & Process"}
      </button>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {slides && (
        <div style={{ marginTop: 20 }}>
          { 
            expand 
            ? 
            <button onClick={()=>setExpand((prev)=>!prev)}>collapse</button> 
            : 
            <button onClick={()=>setExpand((prev)=>!prev)}>expand</button>
          }
          { expand && slides.map((page, idx) => (
            <div key={idx} style={{ marginBottom: 40 }}>
              <h3>Page {idx + 1}</h3>
              <img
                src={`data:image/png;base64,${page.slideBase64}`}
                alt={`Page ${idx + 1} image`}
                style={{ maxWidth: "100%", border: "1px solid #ccc" }}
              />
              <pre
                style={{
                  whiteSpace: "pre-wrap",
                  padding: 10,
                  borderRadius: 4,
                  marginTop: 10,
                  maxHeight: 200,
                  overflowY: "auto",
                }}
              >
                {page.slideText}
              </pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
export default PdfUploader;
