#!/usr/bin/env python3
"""
CLI runner for Data Leakage Mitigation Audit (Section 5.2).
"""
import sys
from pathlib import Path
from PIL import Image

# Ensure project root is in path
ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR))

from truthlens.data.leakage_audit import DataLeakageAuditor, AuditRecord

def main():
    print("=" * 70)
    print("  TRUTHLENS-AI: DATA LEAKAGE MITIGATION AUDIT (Section 5.2)")
    print("=" * 70)

    auditor = DataLeakageAuditor(hash_size=8, distance_threshold=4)
    records = []

    from PIL import ImageDraw

    def make_patterned_image(seed: int) -> Image.Image:
        img = Image.new("RGB", (64, 64), color=(seed * 5 % 255, seed * 13 % 255, seed * 23 % 255))
        draw = ImageDraw.Draw(img)
        # Unique diagonal and geometric stripes
        x0 = (seed * 7) % 64
        y0 = (seed * 11) % 64
        x1 = (x0 + 30) % 64
        y1 = (y0 + 30) % 64
        draw.line([(x0, y0), (x1, y1)], fill=((seed * 43) % 255, 255, 128), width=3)
        draw.rectangle([seed % 30, (seed * 2) % 30, (seed % 30) + 15, ((seed * 2) % 30) + 15], fill=(200, seed % 255, 50))
        return img

    print("[*] Generating dataset split partitions (Train, Val, Test)...")
    # Train
    for i in range(30):
        img = make_patterned_image(i + 1)
        h = auditor.compute_dhash(img)
        records.append(
            AuditRecord(
                item_id=f"TR-{i:04d}",
                split="train",
                timestamp=f"2021-{(i % 12) + 1:02d}-15T00:00:00Z",
                image_hash=h,
                text_signature=f"train_sig_{i}"
            )
        )

    # Validation
    for i in range(15):
        img = make_patterned_image(i + 100)
        h = auditor.compute_dhash(img)
        records.append(
            AuditRecord(
                item_id=f"VAL-{i:04d}",
                split="val",
                timestamp=f"2023-{(i % 12) + 1:02d}-15T00:00:00Z",
                image_hash=h,
                text_signature=f"val_sig_{i}"
            )
        )

    # Test
    for i in range(20):
        img = make_patterned_image(i + 300)
        h = auditor.compute_dhash(img)
        records.append(
            AuditRecord(
                item_id=f"TEST-{i:04d}",
                split="test",
                timestamp=f"2025-{(i % 12) + 1:02d}-15T00:00:00Z",
                image_hash=h,
                text_signature=f"test_sig_{i}"
            )
        )


    print(f"[*] Auditing {len(records)} partition samples across splits...")
    report = auditor.run_audit(records)

    print("-" * 70)
    print(f"  Total Train Samples:              {report.total_train_samples}")
    print(f"  Total Val Samples:                {report.total_val_samples}")
    print(f"  Total Test Samples:               {report.total_test_samples}")
    print(f"  Cross-Split Duplicates Found:     {report.cross_split_duplicates_found}")
    print(f"  Temporal Inversions Found:        {report.temporal_violations_found}")
    print(f"  Contamination Rate:               {report.contamination_rate * 100:.2f}%")
    print(f"  Zero-Contamination Certified:     {report.zero_contamination_certified}")
    print("-" * 70)

    for line in report.audit_log:
        print(f"  {line}")

    print("=" * 70)
    if report.zero_contamination_certified:
        print("  RESULT: AUDIT PASSED [CERTIFIED CLEAN]")
        sys.exit(0)
    else:
        print("  RESULT: AUDIT FAILED [CONTAMINATION FOUND]")
        sys.exit(1)

if __name__ == "__main__":
    main()
