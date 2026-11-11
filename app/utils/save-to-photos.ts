// "Save to Photos" on phones goes through the system share sheet (Web Share
// API with files): iOS offers "Save Image" there, Android offers Google
// Photos / Gallery. A plain download only lands in Files / Downloads.

const IMAGE_TYPES_BY_EXTENSION: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  heic: "image/heic",
  heif: "image/heif",
};

// The share sheet only offers saving to Photos for a real image type, so
// fall back to the file name when the stored object came back untyped.
export function imageMimeType(fileName: string, responseType: string): string {
  if (responseType.startsWith("image/")) {
    return responseType;
  }

  const extension = fileName.split(".").pop()?.toLowerCase() ?? "";
  return IMAGE_TYPES_BY_EXTENSION[extension] ?? "image/jpeg";
}

// Touch devices that can share image files. Desktop browsers that support
// file sharing are left out on purpose: there the plain download is what
// people expect, and their share sheets don't save into a photo library.
export function canSaveToPhotos(): boolean {
  if (typeof navigator === "undefined" || !navigator.canShare) {
    return false;
  }

  if (!window.matchMedia("(pointer: coarse)").matches) {
    return false;
  }

  try {
    return navigator.canShare({
      files: [new File([""], "photo.jpg", { type: "image/jpeg" })],
    });
  } catch {
    return false;
  }
}

export function isShareCancelled(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}
