import os
from datasets import load_dataset

# 1. Tạo thư mục chứa dữ liệu nếu chưa có
backup_folder = "my_local_datasets"
os.makedirs(backup_folder, exist_ok=True)

# 2. Danh sách 6 dataset đã được cập nhật bản sạch
datasets_info = [
    {"name": "AlekseyKorshuk/persona-chat", "config": None},
    {"name": "Ahren09/empathetic_dialogues", "config": None},
    {"name": "databricks/databricks-dolly-15k", "config": None},
    {"name": "Brendan/multiwoz_turns_v22", "config": None},
    {"name": "TokenBender/code_instructions_122k_alpaca_style", "config": None},
    {"name": "mutiyama/alt", "config": "alt-parallel"},
]

print("🚀 Bắt đầu quá trình sao lưu 6 Dataset...")

# 3. Vòng lặp tải và lưu từng dataset
for info in datasets_info:
    ds_name = info["name"]
    config = info["config"]

    print(f"\n⏳ Đang xử lý: {ds_name}...")

    try:
        # Code gốc gọn gàng, không cần trust_remote_code nữa
        if config:
            ds = load_dataset(ds_name, config)
        else:
            ds = load_dataset(ds_name)

        for split in ds.keys():
            safe_name = ds_name.replace("/", "_")
            file_path = os.path.join(backup_folder, f"{safe_name}_{split}.jsonl")

            ds[split].to_json(file_path, force_ascii=False)
            print(f"   ✅ Đã lưu tập '{split}' tại: {file_path}")

    except Exception as e:
        print(f"   ❌ Lỗi khi tải {ds_name}: {e}")

print(
    "\n🎉 Hoàn tất! Toàn bộ kho báu dữ liệu của bạn đã được cất an toàn trong thư mục",
    backup_folder,
)
