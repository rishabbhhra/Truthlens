import torch
import torchvision.transforms as transforms
from PIL import Image
import numpy as np
from typing import Dict, Any, List, Tuple

class MultimodalPreprocessor:
    """
    Standard multimodal data preprocessing for images and text.
    Prepares inputs for Vision Transformer / ResNet and RoBERTa / DeBERTa encoders.
    """
    def __init__(
        self,
        image_size: int = 224,
        max_tokens: int = 128,
        vocab_size: int = 50265
    ):
        self.image_size = image_size
        self.max_tokens = max_tokens
        self.vocab_size = vocab_size

        self.image_transform = transforms.Compose([
            transforms.Resize((image_size, image_size)),
            transforms.ToTensor(),
            transforms.Normalize(
                mean=[0.485, 0.456, 0.406],
                std=[0.229, 0.224, 0.225]
            )
        ])

    def preprocess_image(self, image: Image.Image) -> torch.Tensor:
        """
        Converts PIL image to normalized tensor [1, 3, image_size, image_size].
        """
        rgb_image = image.convert("RGB")
        tensor = self.image_transform(rgb_image).unsqueeze(0)  # [1, 3, 224, 224]
        return tensor

    def tokenize_text(self, text: str) -> Tuple[torch.Tensor, torch.Tensor, List[str]]:
        """
        Tokenizes text string, generating input_ids [1, max_tokens],
        attention_mask [1, max_tokens], and list of raw string tokens.
        """
        words = text.strip().split()
        if not words:
            words = ["<empty>"]

        # Limit to max_tokens - 2 (for CLS and SEP tokens)
        truncated_words = words[: self.max_tokens - 2]
        tokens = ["<s>"] + truncated_words + ["</s>"]

        # Map to deterministic token IDs
        input_ids = []
        for t in tokens:
            if t == "<s>":
                input_ids.append(0)
            elif t == "</s>":
                input_ids.append(2)
            else:
                input_ids.append((abs(hash(t)) % (self.vocab_size - 10)) + 10)

        seq_len = len(input_ids)
        # Pad up to max_tokens
        if seq_len < self.max_tokens:
            pad_len = self.max_tokens - seq_len
            input_ids = input_ids + [1] * pad_len  # 1 is <pad>
            attention_mask = [1] * seq_len + [0] * pad_len
        else:
            input_ids = input_ids[: self.max_tokens]
            attention_mask = [1] * self.max_tokens

        ids_tensor = torch.tensor(input_ids, dtype=torch.long).unsqueeze(0)
        mask_tensor = torch.tensor(attention_mask, dtype=torch.long).unsqueeze(0)

        return ids_tensor, mask_tensor, truncated_words
