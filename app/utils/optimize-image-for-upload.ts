export type OptimizeImageOptions = {
    maxLongEdge?: number;
    maxUploadBytes?: number;
    qualities?: number[];
    outputType?: "image/jpeg";
};

export const MAX_UPLOAD_BYTES = 9_500_000;

const DEFAULT_OPTIONS: Required<OptimizeImageOptions> = {
    maxLongEdge: 3000,
    maxUploadBytes: MAX_UPLOAD_BYTES,
    qualities: [0.9, 0.86, 0.82, 0.78, 0.74],
    outputType: "image/jpeg",
};

function renameToJpeg(name: string) {
    return name.replace(/\.[^.]+$/, "") + ".jpg";
}

function getTargetDimensions(
    width: number,
    height: number,
    maxLongEdge: number
) {
    const longEdge = Math.max(width, height);

    if (longEdge <= maxLongEdge) {
        return { width, height, resized: false };
    }

    const scale = maxLongEdge / longEdge;

    return {
        width: Math.round(width * scale),
        height: Math.round(height * scale),
        resized: true,
    };
}

async function loadImageElement(file: File): Promise<HTMLImageElement> {
    const objectUrl = URL.createObjectURL(file);

    try {
        return await new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () =>
                reject(new Error(`Failed to read image: ${file.name}`));
            img.src = objectUrl;
        });
    } finally {
        setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
    }
}

async function canvasToFile(
    canvas: HTMLCanvasElement,
    fileName: string,
    quality: number,
    outputType: "image/jpeg"
): Promise<File | null> {
    const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, outputType, quality);
    });

    if (!blob) return null;

    return new File([blob], renameToJpeg(fileName), {
        type: outputType,
    });
}

export async function optimizeImageForUpload(
    file: File,
    options: OptimizeImageOptions = {}
): Promise<File> {
    const {
        maxLongEdge,
        maxUploadBytes,
        qualities,
        outputType,
    } = { ...DEFAULT_OPTIONS, ...options };

    if (!file.type.startsWith("image/")) {
        return file;
    }

    const image = await loadImageElement(file);
    const { width, height, resized } = getTargetDimensions(
        image.width,
        image.height,
        maxLongEdge
    );

    if (file.type === "image/jpeg" && file.size <= maxUploadBytes && !resized) {
        return file;
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) {
        return file;
    }

    ctx.drawImage(image, 0, 0, width, height);

    let bestCandidate: File | null = null;

    for (const quality of qualities) {
        const candidate = await canvasToFile(
            canvas,
            file.name,
            quality,
            outputType
        );

        if (!candidate) continue;

        bestCandidate = candidate;

        if (candidate.size <= maxUploadBytes) {
            return candidate;
        }
    }

    return bestCandidate ?? file;
}