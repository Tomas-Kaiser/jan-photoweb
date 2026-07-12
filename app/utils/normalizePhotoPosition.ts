export const normalizePhotoPosition = (value?: string) => {
    if (!value) return "50% 35%";

    const trimmed = value.trim().toLowerCase();

    if (trimmed === "top") return "50% 0%";
    if (trimmed === "center") return "50% 50%";

    const topMatch = trimmed.match(/^top(\d{1,3})$/);
    if (topMatch) {
        return `50% ${topMatch[1]}%`;
    }

    return trimmed;
};