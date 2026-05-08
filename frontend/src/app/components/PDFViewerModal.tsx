import { useState, useEffect } from "react";
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download, FileText, Maximize2 } from "lucide-react";
import { Citation } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface PDFViewerModalProps {
  citation: Citation | null;
  onClose: () => void;
}

// Generate surrounding text for realistic page simulation
function generatePageContent(citation: Citation): { before: string; highlight: string; after: string } {
  const surroundingTexts: Record<string, { before: string; after: string }> = {
    "Lịch sử Việt Nam – Tập 3 (1945–1975).pdf": {
      before: "Sau những thất bại liên tiếp ở chiến trường miền Nam, Bộ Tư lệnh Quân lực Việt Nam Cộng hòa rơi vào tình trạng hoang mang, mất phương hướng. Các tướng lĩnh cao cấp tìm cách tháo chạy, để lại hàng vạn binh sĩ không người chỉ huy. Trong bối cảnh đó, tại Hà Nội, các nhà lãnh đạo Đảng và Nhà nước đã họp khẩn để đánh giá tình hình và đề ra quyết sách chiến lược cho giai đoạn cuối của cuộc kháng chiến.",
      after: "Quyết định đó được cụ thể hóa thành mệnh lệnh cho các đơn vị chiến đấu: \"Thần tốc, thần tốc hơn nữa – Táo bạo, táo bạo hơn nữa – Tranh thủ từng giờ, từng phút – Xốc tới mặt trận – Giải phóng miền Nam – Quyết chiến và toàn thắng\". Các quân đoàn chủ lực nhận được lệnh hành quân gấp về phía Sài Gòn.",
    },
    "Đại thắng Mùa Xuân 1975 – Văn Tiến Dũng.pdf": {
      before: "Ngày 26 tháng 4, tất cả các hướng đồng loạt nổ súng. Pháo binh ta bắn phá dữ dội vào các căn cứ phòng thủ vòng ngoài của địch. Từng mũi tiến công thọc sâu, tiêu diệt các chốt địch, mở đường cho xe tăng và bộ binh tiến vào nội đô. Khí thế chiến đấu của bộ đội ta như triều dâng sóng vỡ.",
      after: "Ngay trong đêm 26 rạng ngày 27, toàn bộ các tuyến phòng thủ vòng ngoài của địch bị đột phá hoặc vô hiệu hóa. Sáng ngày 27, các cánh quân ta tiếp tục thừa thắng truy kích, tiêu diệt và làm tan rã nhiều đơn vị địch, tiến sát đến các cửa ngõ Sài Gòn.",
    },
    "Lịch sử Việt Nam Cổ-Trung đại – NXB Giáo Dục.pdf": {
      before: "Sau khi lên ngôi, Lý Công Uẩn – người xuất thân từ đất Cổ Pháp (Bắc Ninh ngày nay) – nhận thấy Hoa Lư, kinh đô cũ, không còn phù hợp với yêu cầu phát triển của đất nước. Thành Hoa Lư nằm trong vùng núi non hiểm trở, chỉ thích hợp cho phòng thủ quân sự mà không thuận tiện cho việc giao thương và quản lý đất nước trong thời bình.",
      after: "Thăng Long – nghĩa là \"Rồng bay lên\" – từ đó trở thành kinh đô của Đại Việt trong suốt nhiều thế kỷ. Thành được xây dựng với quy mô hoành tráng, gồm ba vòng thành: Đại Nội (nơi ở của vua), Hoàng thành và La thành bao bọc toàn bộ kinh đô.",
    },
  };

  const textSet = surroundingTexts[citation.fileName] || {
    before: "Theo các tài liệu lịch sử được lưu trữ, sự kiện này đánh dấu một bước ngoặt quan trọng trong tiến trình lịch sử dân tộc. Các nhà nghiên cứu đã dày công tìm hiểu và phân tích nhiều nguồn tư liệu khác nhau để có thể dựng lại bức tranh toàn cảnh về giai đoạn lịch sử đặc biệt này.",
    after: "Những sự kiện tiếp theo cho thấy tầm quan trọng và ảnh hưởng lâu dài của quyết định này đối với cục diện lịch sử. Hậu thế nhìn lại không khỏi thán phục trước tầm nhìn chiến lược và sự dũng cảm của những người đã đưa ra quyết định trong thời điểm đó.",
  };

  return {
    before: textSet.before,
    highlight: citation.excerpt,
    after: textSet.after,
  };
}

export function PDFViewerModal({ citation, onClose }: PDFViewerModalProps) {
  const [currentPage, setCurrentPage] = useState(citation?.page ?? 1);
  const [zoom, setZoom] = useState(100);

  useEffect(() => {
    if (citation?.page) setCurrentPage(citation.page);
  }, [citation]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  if (!citation) return null;

  const totalPages = Math.max(citation.page ? citation.page + 20 : 50, 50);
  const pageContent = generatePageContent(citation);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.25 }}
          className="flex flex-col rounded-2xl overflow-hidden"
          style={{
            width: "min(900px, 95vw)",
            height: "min(700px, 92vh)",
            background: "var(--t-card-bg2)",
            border: "1px solid var(--t-gold-border)",
            boxShadow: "0 32px 80px rgba(0,0,0,0.6)",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
            style={{ borderBottom: "1px solid rgba(201,168,76,0.15)", background: "rgba(10,18,35,0.95)" }}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(201,168,76,0.15)", border: "1px solid rgba(201,168,76,0.25)" }}
            >
              <FileText size={15} style={{ color: "#c9a84c" }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm truncate" style={{ color: "rgba(255,255,255,0.85)" }}>
                {citation.fileName}
              </p>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                Trang {currentPage} / {totalPages} · {citation.chunkId}
              </p>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setZoom((z) => Math.max(75, z - 25))}
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:bg-white/[0.06]"
                style={{ color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.08)" }}
                title="Thu nhỏ"
              >
                <ZoomOut size={13} />
              </button>
              <span className="text-xs px-2" style={{ color: "rgba(255,255,255,0.4)" }}>
                {zoom}%
              </span>
              <button
                onClick={() => setZoom((z) => Math.min(200, z + 25))}
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:bg-white/[0.06]"
                style={{ color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.08)" }}
                title="Phóng to"
              >
                <ZoomIn size={13} />
              </button>
              <button
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:bg-white/[0.06]"
                style={{ color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.08)" }}
                title="Toàn màn hình"
              >
                <Maximize2 size={13} />
              </button>
              <button
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:bg-white/[0.06]"
                style={{ color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.08)" }}
                title="Tải xuống"
              >
                <Download size={13} />
              </button>
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:bg-red-500/10"
                style={{ color: "rgba(255,100,100,0.6)", border: "1px solid rgba(255,100,100,0.15)" }}
                title="Đóng"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Body: sidebar + viewer */}
          <div className="flex flex-1 min-h-0">
            {/* Left: thumbnail sidebar */}
            <div
              className="w-20 flex-shrink-0 flex flex-col gap-2 p-2 overflow-y-auto"
              style={{ borderRight: "1px solid rgba(255,255,255,0.06)", background: "rgba(6,12,24,0.8)" }}
            >
              {Array.from({ length: Math.min(8, totalPages) }, (_, i) => {
                const pg = Math.max(1, (citation.page ?? 1) - 3 + i);
                const isActive = pg === currentPage;
                return (
                  <button
                    key={pg}
                    onClick={() => setCurrentPage(pg)}
                    className="w-full flex flex-col items-center gap-1 p-1 rounded-lg transition-all"
                    style={{
                      background: isActive ? "rgba(201,168,76,0.15)" : "transparent",
                      border: isActive ? "1px solid rgba(201,168,76,0.3)" : "1px solid transparent",
                    }}
                  >
                    {/* Tiny page thumbnail */}
                    <div
                      className="w-12 rounded"
                      style={{
                        height: "60px",
                        background: isActive ? "rgba(240,230,200,0.15)" : "rgba(255,255,255,0.06)",
                        border: `1px solid ${isActive ? "rgba(201,168,76,0.4)" : "rgba(255,255,255,0.08)"}`,
                      }}
                    >
                      {isActive && (
                        <div className="w-full h-full flex flex-col gap-1 p-1">
                          {Array.from({ length: 6 }).map((_, li) => (
                            <div
                              key={li}
                              className="h-1 rounded-full"
                              style={{ background: "rgba(201,168,76,0.3)", width: `${60 + Math.random() * 30}%` }}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                    <span
                      className="text-xs"
                      style={{ color: isActive ? "#c9a84c" : "rgba(255,255,255,0.25)" }}
                    >
                      {pg}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Right: PDF page content */}
            <div
              className="flex-1 overflow-y-auto flex justify-center p-6"
              style={{
                background: "rgba(8,14,28,0.6)",
                scrollbarWidth: "thin",
                scrollbarColor: "rgba(201,168,76,0.2) transparent",
              }}
            >
              <motion.div
                key={currentPage}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
                style={{
                  width: `${zoom}%`,
                  minWidth: "300px",
                  maxWidth: "650px",
                  background: "rgba(240, 235, 220, 0.96)",
                  borderRadius: "4px",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                  padding: "48px 56px",
                  minHeight: "500px",
                }}
              >
                {/* Page header */}
                <div
                  className="flex items-center justify-between pb-4 mb-5"
                  style={{ borderBottom: "1px solid rgba(0,0,0,0.15)" }}
                >
                  <span
                    className="text-xs"
                    style={{ color: "rgba(60,40,20,0.5)", fontFamily: "Georgia, serif" }}
                  >
                    {citation.fileName.replace(".pdf", "")}
                  </span>
                  <span
                    className="text-xs"
                    style={{ color: "rgba(60,40,20,0.5)", fontFamily: "Georgia, serif" }}
                  >
                    Trang {currentPage}
                  </span>
                </div>

                {/* Page content */}
                <div style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
                  {/* Section heading (simulated) */}
                  <h3
                    className="mb-4"
                    style={{
                      color: "#1a0e00",
                      fontSize: "14px",
                      fontWeight: "700",
                      letterSpacing: "0.02em",
                    }}
                  >
                    {currentPage === citation.page
                      ? `Chương ${Math.floor((citation.page ?? 1) / 30) + 1}: Giai đoạn lịch sử quan trọng`
                      : `Nội dung trang ${currentPage}`}
                  </h3>

                  {/* Before text */}
                  <p
                    className="mb-4 leading-loose text-sm"
                    style={{ color: "#2a1a0a", textAlign: "justify" }}
                  >
                    {currentPage === citation.page ? pageContent.before : "Nội dung trang này tiếp tục phân tích các sự kiện lịch sử quan trọng. Các tư liệu gốc được sưu tầm từ nhiều nguồn khác nhau, đảm bảo tính khách quan và toàn diện trong việc trình bày lịch sử dân tộc."}
                  </p>

                  {/* Highlighted excerpt */}
                  {currentPage === citation.page && (
                    <div className="my-4 relative">
                      <p
                        className="leading-loose text-sm px-4 py-3 rounded"
                        style={{
                          color: "#1a0800",
                          textAlign: "justify",
                          background: "rgba(201,168,76,0.25)",
                          border: "2px solid rgba(201,168,76,0.6)",
                          borderLeft: "4px solid #c9a84c",
                          boxShadow: "0 0 0 3px rgba(201,168,76,0.1)",
                        }}
                      >
                        {pageContent.highlight}
                      </p>
                      {/* Highlight label */}
                      <div
                        className="absolute -top-2.5 left-3 px-2 py-0.5 rounded text-xs"
                        style={{ background: "#c9a84c", color: "#1a0800", fontFamily: "sans-serif", fontWeight: 600 }}
                      >
                        Đoạn trích dẫn
                      </div>
                    </div>
                  )}

                  {/* After text */}
                  {currentPage === citation.page && (
                    <p
                      className="mt-4 leading-loose text-sm"
                      style={{ color: "#2a1a0a", textAlign: "justify" }}
                    >
                      {pageContent.after}
                    </p>
                  )}

                  {/* Footnote area */}
                  <div
                    className="mt-10 pt-4"
                    style={{ borderTop: "1px solid rgba(0,0,0,0.15)" }}
                  >
                    {[1, 2].map((fn) => (
                      <p key={fn} className="text-xs mb-1" style={{ color: "rgba(60,40,20,0.5)", fontFamily: "Georgia, serif" }}>
                        {fn}. Chú thích học thuật số {fn} – tham khảo tài liệu bổ sung liên quan đến nội dung đoạn văn trên.
                      </p>
                    ))}
                  </div>
                </div>

                {/* Page footer */}
                <div
                  className="flex items-center justify-center mt-8 pt-4"
                  style={{ borderTop: "1px solid rgba(0,0,0,0.1)" }}
                >
                  <span
                    className="text-xs"
                    style={{ color: "rgba(60,40,20,0.4)", fontFamily: "Georgia, serif" }}
                  >
                    — {currentPage} —
                  </span>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Footer: page navigation + citation info */}
          <div
            className="flex items-center justify-between px-4 py-3 flex-shrink-0"
            style={{ borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(10,18,35,0.95)" }}
          >
            {/* Citation metadata */}
            <div className="flex items-center gap-3">
              <span
                className="text-xs px-2.5 py-1 rounded-lg"
                style={{ background: "rgba(201,168,76,0.1)", color: "#c9a84c", border: "1px solid rgba(201,168,76,0.2)" }}
              >
                📍 Trang {citation.page}
              </span>
              <span
                className="text-xs"
                style={{ color: "rgba(255,255,255,0.3)", fontFamily: "monospace" }}
              >
                {citation.chunkId}
              </span>
            </div>

            {/* Page navigation */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:bg-white/[0.06]"
                style={{ color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                <ChevronLeft size={14} />
              </button>
              <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:bg-white/[0.06]"
                style={{ color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                <ChevronRight size={14} />
              </button>

              <button
                onClick={() => setCurrentPage(citation.page ?? 1)}
                className="ml-2 text-xs px-3 py-1.5 rounded-lg transition-all hover:opacity-80"
                style={{ background: "rgba(201,168,76,0.12)", color: "#c9a84c", border: "1px solid rgba(201,168,76,0.2)" }}
              >
                Về trang trích dẫn
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}