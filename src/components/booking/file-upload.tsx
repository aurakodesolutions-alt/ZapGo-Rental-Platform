"use client";

import { useState, useRef, ChangeEvent } from "react";
import Image from "next/image";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { UploadCloud, X, File as FileIcon } from "lucide-react";

interface FileUploadProps {
    file: File | undefined;
    onFileChange: (file: File | undefined) => void;
}

export function FileUpload({ file, onFileChange }: FileUploadProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [preview, setPreview] = useState<string | null>(file ? URL.createObjectURL(file) : null);
    const [isPdf, setIsPdf] = useState(file?.type === 'application/pdf');

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        const selectedFile = event.target.files?.[0];
        if (selectedFile) {
            onFileChange(selectedFile);
            setPreview(URL.createObjectURL(selectedFile));
            setIsPdf(selectedFile.type === 'application/pdf');
        }
    };

    const handleRemove = () => {
        onFileChange(undefined);
        setPreview(null);
        setIsPdf(false);
        if(fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const triggerFileSelect = () => {
        fileInputRef.current?.click();
    }

    return (
        <div>
            <Input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/jpeg,image/png,image/webp,application/pdf"
            />

            {!preview && (
                <div
                    onClick={triggerFileSelect}
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted"
                >
                    <UploadCloud className="w-8 h-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mt-2">Click or drag file to upload</p>
                    <p className="text-xs text-muted-foreground">PNG, JPG, WEBP, PDF (max 10MB)</p>
                </div>
            )}

            {preview && (
                <div className="relative w-full h-32 border rounded-lg p-2">
                    {isPdf ? (
                        <div className="flex flex-col items-center justify-center h-full bg-muted/50 rounded-md">
                            <FileIcon className="w-10 h-10 text-destructive" />
                            <p className="text-sm font-medium mt-2 truncate max-w-[90%]">{file?.name}</p>
                        </div>
                    ) : (
                        <Image src={preview} alt="File preview" layout="fill" objectFit="contain" className="rounded-md" />
                    )}
                    <Button variant="destructive" size="icon" className="absolute -top-3 -right-3 h-7 w-7 rounded-full" onClick={handleRemove}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            )}
        </div>
    );
}
