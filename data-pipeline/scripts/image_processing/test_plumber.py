import pdfplumber
import os

# Trỏ đường dẫn tới Tập 7 (đổi tên file nếu cần)
script_dir = os.path.dirname(os.path.abspath(__file__))
pdf_path = os.path.join(script_dir, "../data/raw/Lch s Vit Nam tp 07 T nm 1897 n nm 1918-T Th Thy-2017.pdf")

def test_pdfplumber(file_path, test_page_num=15):
    print(f"🔍 Đang dùng pdfplumber mổ xẻ file: {os.path.basename(file_path)}")
    
    try:
        with pdfplumber.open(file_path) as pdf:
            # pdfplumber đếm trang từ 0, trang 15 tương đương index 15
            page = pdf.pages[test_page_num]
            
            # 1. Thử trích xuất text thông thường
            text = page.extract_text()
            print("\n--- NỘI DUNG TEXT ---")
            print(text[:300] if text else "❌ Vẫn không lấy được chữ!")
            print("-" * 20)
            
            # 2. Thử lấy Tọa độ của từng chữ (Mục tiêu tối thượng của RAG)
            words = page.extract_words()
            if words:
                print(f"✅ Đã trích xuất được {len(words)} từ kèm tọa độ trên trang này.")
                print("\n📌 Tọa độ 3 từ đầu tiên:")
                for i in range(min(3, len(words))):
                    w = words[i]
                    print(f"Từ: '{w['text']}' -> [x0: {w['x0']:.1f}, top: {w['top']:.1f}, x1: {w['x1']:.1f}, bottom: {w['bottom']:.1f}]")
            else:
                print("❌ Không lấy được tọa độ từ nào.")
                
    except Exception as e:
        print(f"Lỗi: {e}")

if __name__ == "__main__":
    test_pdfplumber(pdf_path)