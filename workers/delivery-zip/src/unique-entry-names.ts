function splitExtension(fileName: string): [string, string] {
  const dot = fileName.lastIndexOf(".");
  // A leading dot (".hidden") is part of the name, not an extension.
  return dot > 0 ? [fileName.slice(0, dot), fileName.slice(dot)] : [fileName, ""];
}

// Zip entries are keyed by name, so two finals uploaded with the same file
// name would overwrite each other when extracted. Keeps the first occurrence
// as-is and numbers the rest: "IMG_001.jpg", "IMG_001 (2).jpg", ...
// Compared case-insensitively, because macOS and Windows extract
// "IMG_001.JPG" and "img_001.jpg" to the same file.
export function uniqueEntryNames(fileNames: string[]): string[] {
  const used = new Set<string>();
  return fileNames.map((fileName) => {
    const [base, extension] = splitExtension(fileName);
    let candidate = fileName;
    for (let n = 2; used.has(candidate.toLowerCase()); n++) {
      candidate = `${base} (${n})${extension}`;
    }
    used.add(candidate.toLowerCase());
    return candidate;
  });
}
