export function readImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new window.Image();
    const revoke = () => URL.revokeObjectURL(url);

    image.onload = () => {
      revoke();
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
    };
    image.onerror = () => {
      revoke();
      reject(new Error("Unable to read image dimensions."));
    };
    image.src = url;
  });
}