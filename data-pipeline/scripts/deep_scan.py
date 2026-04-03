import fitz
import os

def deep_scan_specific_pdf(file_path):
    if not os.path.exists(file_path):
        print(f"❌ Không tìm thấy file: {file_path}")
        return

    doc = fitz.open(file_path)
    file_name = os.path.basename(file_path)
    
    # SỬA LỖI: Lưu số trang vào một biến cố định trước khi đóng file
    total_pages = doc.page_count 
    
    print(f"🔍 BẮT ĐẦU QUÉT SÂU FILE: {file_name}")
    print(f"Tổng số trang: {total_pages}\n")
    
    empty_pages = [] 
    
    for i in range(total_pages):
        page = doc.load_page(i)
        text = page.get_text("text").strip()
        
        if len(text) < 50:
            empty_pages.append(i + 1)
            
    # Đóng file sau khi đã xử lý xong các trang
    doc.close()
    
    # Báo cáo kết quả sử dụng biến total_pages
    print("-" * 40)
    print(f"📊 KẾT QUẢ CHO: {file_name}")
    print(f" - Số trang có chứa chữ (đọc được): {total_pages - len(empty_pages)}")
    print(f" - Số trang là ảnh / trống (không đọc được chữ): {len(empty_pages)}")
    
    if empty_pages:
        print(f"\n⚠️ Danh sách các trang CẦN LƯU Ý (Không có chữ):")
        for i in range(0, len(empty_pages), 15):
            print(empty_pages[i:i+15])

script_dir = os.path.dirname(os.path.abspath(__file__))
# Nhớ đổi tên file cho khớp với tập 7 hoặc tập 4 của em
pdf_to_check = os.path.join(script_dir, "../data/raw/Lch s Vit Nam tp 07 T nm 1897 n nm 1918-T Th Thy-2017.pdf")

deep_scan_specific_pdf(pdf_to_check)