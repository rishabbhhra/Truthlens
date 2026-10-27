import io
import base64
import numpy as np
from PIL import Image
import matplotlib
from matplotlib import colormaps

class Visualizer:
    """
    Renders visual explainability heatmaps, composite image overlays,
    and exports them to base64 data URIs for web frontend consumption.
    """
    def __init__(self, colormap: str = "turbo"):
        self.colormap = colormap

    def create_overlay(
        self,
        original_image: Image.Image,
        heatmap: np.ndarray,
        alpha: float = 0.5
    ) -> str:
        """
        Overlays normalized heatmap [0, 1] onto original PIL Image and returns base64 PNG data URL.
        """
        # Resize original image to match heatmap size (224, 224)
        orig_resized = original_image.convert("RGB").resize((224, 224))
        orig_np = np.array(orig_resized, dtype=np.float32) / 255.0

        # Apply colormap to heatmap
        cmap = colormaps[self.colormap]
        colored_cam = cmap(heatmap)[:, :, :3]  # [224, 224, 3] in [0, 1]

        # Blend
        overlay = (1.0 - alpha) * orig_np + alpha * colored_cam
        overlay = np.clip(overlay * 255.0, 0, 255).astype(np.uint8)

        # Convert to PNG base64
        overlay_img = Image.fromarray(overlay)
        buffered = io.BytesIO()
        overlay_img.save(buffered, format="PNG")
        encoded = base64.b64encode(buffered.getvalue()).decode("utf-8")
        return f"data:image/png;base64,{encoded}"

    def create_pure_heatmap(self, heatmap: np.ndarray) -> str:
        """
        Renders heatmap alone with colormap and returns base64 PNG data URL.
        """
        cmap = colormaps[self.colormap]
        colored = cmap(heatmap)[:, :, :3]
        colored = np.clip(colored * 255.0, 0, 255).astype(np.uint8)

        img = Image.fromarray(colored)
        buffered = io.BytesIO()
        img.save(buffered, format="PNG")
        encoded = base64.b64encode(buffered.getvalue()).decode("utf-8")
        return f"data:image/png;base64,{encoded}"
