import { Conversation, Message, FlashcardDeck } from "./types";

const msg = (
  id: string,
  role: "user" | "assistant",
  content: string,
  extra?: Partial<Message>
): Message => ({
  id,
  role,
  content,
  timestamp: new Date(),
  hasCitations: false,
  ...extra,
});

export const SAMPLE_QUESTIONS = [
  "Nguyên nhân nào dẫn đến thắng lợi của Chiến dịch Hồ Chí Minh năm 1975?",
  "Triều đại nhà Lý đã có những đóng góp gì trong việc xây dựng nhà nước phong kiến Việt Nam?",
  "Vai trò của Nguyễn Ái Quốc trong phong trào giải phóng dân tộc Việt Nam đầu thế kỷ XX?",
];

export const DEMO_CONVERSATION_1: Message[] = [
  msg("u1", "user", "Nguyên nhân nào dẫn đến thắng lợi của Chiến dịch Hồ Chí Minh năm 1975?"),
  msg("a1", "assistant", `Chiến dịch Hồ Chí Minh (26/4–30/4/1975) thắng lợi xuất phát từ sự hội tụ của nhiều nhân tố quyết định:\n\n**1. Sự lãnh đạo tài tình của Đảng Cộng sản Việt Nam**\nBộ Chính trị và Quân ủy Trung ương đã kịp thời nắm bắt thời cơ chiến lược sau thắng lợi của chiến dịch Tây Nguyên (tháng 3/1975) và chiến dịch Huế – Đà Nẵng. Quyết định "thần tốc, táo bạo, bất ngờ, chắc thắng" được ban hành chỉ trong vòng vài ngày là minh chứng cho tư duy chiến lược sắc bén.\n\n**2. Lực lượng quân sự áp đảo**\nQuân Giải phóng huy động hơn 5 quân đoàn với khoảng 270.000 quân, trang bị vũ khí hiện đại từ các nguồn viện trợ, tạo ưu thế tuyệt đối về binh lực so với Quân lực Việt Nam Cộng hòa đang tan rã tinh thần.\n\n**3. Sự sụp đổ tinh thần và tổ chức của địch**\nSau khi mất Tây Nguyên và miền Trung, quân đội Sài Gòn rơi vào tình trạng hỗn loạn. Mỹ cắt giảm viện trợ khiến khả năng chiến đấu suy giảm nghiêm trọng.\n\n**4. Phong trào nổi dậy của nhân dân**\nNhân dân trong vùng kiểm soát của chính quyền Sài Gòn đã nổi dậy phối hợp, tạo thế "trong đánh ra, ngoài đánh vào" làm tê liệt hệ thống phòng thủ.`, {
    hasCitations: true,
    citations: [
      {
        id: "c1",
        fileName: "Lịch sử Việt Nam – Tập 3 (1945–1975).pdf",
        page: 412,
        chunkId: "chunk_0412_02",
        excerpt: "Bộ Chính trị họp và nhận định: thời cơ chiến lược đã đến, phải tranh thủ thời gian cao độ, hoàn thành giải phóng miền Nam trước mùa mưa năm 1975, không để chậm trễ...",
      },
      {
        id: "c2",
        fileName: "Đại thắng Mùa Xuân 1975 – Văn Tiến Dũng.pdf",
        page: 87,
        chunkId: "chunk_0087_01",
        excerpt: "Lực lượng tiến công gồm 4 quân đoàn chủ lực, một lực lượng tương đương quân đoàn và các binh đoàn độc lập, tổng cộng hơn 270.000 quân chiến đấu và phục vụ chiến đấu...",
      },
      {
        id: "c3",
        fileName: "Cuộc kháng chiến chống Mỹ cứu nước – NXB QĐND.pdf",
        page: 156,
        chunkId: "chunk_0156_03",
        excerpt: "Việc Hoa Kỳ cắt giảm viện trợ từ 1,6 tỷ USD (1973) xuống còn 700 triệu USD (1974) đã khiến quân đội Sài Gòn thiếu đạn dược, nhiên liệu trầm trọng, ảnh hưởng nặng nề đến sức chiến đấu...",
      },
    ],
    relatedTopics: [
      {
        id: "r1",
        title: "Chiến dịch Tây Nguyên (1975)",
        description: "Chiến dịch mở màn cho cuộc Tổng tiến công mùa Xuân, đánh dấu bước ngoặt chiến lược quan trọng với việc giải phóng Ban Mê Thuột.",
        tags: ["1975", "Chiến dịch", "Miền Nam"],
      },
      {
        id: "r2",
        title: "Hiệp định Paris 1973",
        description: "Hiệp định chấm dứt chiến tranh, lập lại hòa bình ở Việt Nam, buộc Mỹ rút quân và tạo tiền đề cho thắng lợi cuối cùng.",
        tags: ["Ngoại giao", "1973", "Hoa Kỳ"],
      },
    ],
    suggestedFlashcards: [
      {
        id: "f1",
        question: "Chiến dịch Hồ Chí Minh diễn ra từ ngày nào đến ngày nào?",
        answer: "Chiến dịch Hồ Chí Minh diễn ra từ ngày 26/4/1975 đến ngày 30/4/1975, kết thúc với sự kiện xe tăng húc đổ cổng Dinh Độc Lập.",
        status: "new",
      },
      {
        id: "f2",
        question: "Ai là Tổng tư lệnh chiến dịch Hồ Chí Minh?",
        answer: "Đại tướng Văn Tiến Dũng là Tư lệnh chiến dịch. Đại tướng Võ Nguyên Giáp chỉ đạo chung từ Hà Nội.",
        status: "new",
      },
      {
        id: "f3",
        question: "Quân Giải phóng huy động bao nhiêu quân trong Chiến dịch Hồ Chí Minh?",
        answer: "Hơn 270.000 quân chiến đấu, bao gồm 4 quân đoàn chủ lực và các binh đoàn độc lập.",
        status: "new",
      },
    ],
  }),
];

export const DEMO_CONVERSATION_2: Message[] = [
  msg("u2", "user", "Triều đại nhà Lý đã có những đóng góp gì trong việc xây dựng nhà nước phong kiến Việt Nam?"),
  msg("a2", "assistant", `Nhà Lý (1009–1225) là một trong những triều đại có đóng góp nền tảng nhất trong lịch sử nhà nước phong kiến Việt Nam, để lại di sản quan trọng trên nhiều phương diện:\n\n**1. Xây dựng bộ máy nhà nước trung ương tập quyền**\nVua Lý Thái Tổ dời đô từ Hoa Lư về Đại La (nay là Hà Nội), đổi tên thành Thăng Long năm 1010. Triều Lý xây dựng hệ thống hành chính gồm 24 lộ, hoàn thiện bộ máy từ trung ương xuống địa phương.\n\n**2. Ban hành bộ luật thành văn đầu tiên**\nNăm 1042, vua Lý Thái Tông ban hành *Hình thư* – bộ luật thành văn đầu tiên của Đại Việt, đặt nền móng cho pháp luật phong kiến Việt Nam.\n\n**3. Phát triển giáo dục và thi cử**\nNăm 1070, Văn Miếu được xây dựng; năm 1076, Quốc Tử Giám được thành lập – trường đại học đầu tiên của Việt Nam. Chế độ thi cử Nho học bắt đầu được tổ chức bài bản.`, {
    hasCitations: true,
    citations: [
      {
        id: "c4",
        fileName: "Lịch sử Việt Nam Cổ-Trung đại – NXB Giáo Dục.pdf",
        page: 203,
        chunkId: "chunk_0203_01",
        excerpt: "Mùa thu năm Canh Tuất (1010), vua Lý Thái Tổ ban chiếu dời đô từ Hoa Lư ra thành Đại La, đổi tên là Thăng Long. Đây là bước ngoặt lớn đánh dấu sự phát triển của nhà nước phong kiến...",
      },
      {
        id: "c5",
        fileName: "Đại Việt Sử Ký Toàn Thư – Bản dịch hiện đại.pdf",
        page: 318,
        chunkId: "chunk_0318_04",
        excerpt: "Năm Thiên Cảm Thánh Vũ thứ nhất (1042), xuống chiếu định Hình thư. Trước đây hình luật chưa có văn bản, việc xử kiện tùy người, nhiều khi không đúng pháp luật...",
      },
    ],
    suggestedFlashcards: [
      {
        id: "fl1",
        question: "Nhà Lý được thành lập năm nào và kéo dài đến khi nào?",
        answer: "Nhà Lý được thành lập năm 1009 (Lý Thái Tổ lên ngôi) và kéo dài đến năm 1225.",
        status: "new",
      },
      {
        id: "fl2",
        question: "Bộ luật thành văn đầu tiên của Đại Việt tên là gì?",
        answer: "Hình thư, ban hành năm 1042 dưới triều vua Lý Thái Tông.",
        status: "new",
      },
    ],
  }),
];

export const INITIAL_CONVERSATIONS: Conversation[] = [
  {
    id: "conv1",
    title: "Chiến dịch Hồ Chí Minh 1975",
    lastMessage: "Nguyên nhân nào dẫn đến thắng lợi...",
    timestamp: new Date(Date.now() - 1000 * 60 * 5),
    messages: DEMO_CONVERSATION_1,
  },
  {
    id: "conv2",
    title: "Triều đại nhà Lý",
    lastMessage: "Triều đại nhà Lý đã có những đóng góp gì...",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    messages: DEMO_CONVERSATION_2,
  },
  {
    id: "conv3",
    title: "Khởi nghĩa Hai Bà Trưng",
    lastMessage: "Ý nghĩa lịch sử của cuộc khởi nghĩa...",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
    messages: [],
  },
  {
    id: "conv4",
    title: "Phong trào Đông Du",
    lastMessage: "Phan Bội Châu và phong trào Đông Du...",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48),
    messages: [],
  },
];

export const INITIAL_FLASHCARD_DECKS: FlashcardDeck[] = [
  {
    id: "deck1",
    title: "Chiến tranh Việt Nam 1954–1975",
    topic: "Lịch sử hiện đại",
    description: "Các sự kiện và nhân vật quan trọng trong giai đoạn kháng chiến chống Mỹ",
    cards: [
      { id: "d1c1", question: "Chiến dịch Hồ Chí Minh diễn ra từ ngày nào đến ngày nào?", answer: "Từ 26/4/1975 đến 30/4/1975, kết thúc với sự kiện xe tăng húc đổ cổng Dinh Độc Lập.", status: "mastered" },
      { id: "d1c2", question: "Ai là Tổng tư lệnh chiến dịch Hồ Chí Minh?", answer: "Đại tướng Văn Tiến Dũng là Tư lệnh chiến dịch. Đại tướng Võ Nguyên Giáp chỉ đạo chung từ Hà Nội.", status: "mastered" },
      { id: "d1c3", question: "Hiệp định Paris được ký kết vào năm nào?", answer: "Hiệp định Paris về chấm dứt chiến tranh và lập lại hòa bình ở Việt Nam được ký ngày 27/1/1973.", status: "learning" },
      { id: "d1c4", question: "Chiến lược 'Việt Nam hóa chiến tranh' do ai đề ra?", answer: "Tổng thống Mỹ Richard Nixon đề ra năm 1969, nhằm thay thế quân Mỹ bằng quân đội Sài Gòn.", status: "learning" },
      { id: "d1c5", question: "Trận Điện Biên Phủ kết thúc vào ngày nào?", answer: "7/5/1954, quân Pháp đầu hàng, kết thúc cuộc kháng chiến chống Pháp.", status: "new" },
      { id: "d1c6", question: "Quân Giải phóng huy động bao nhiêu quân trong Chiến dịch Hồ Chí Minh?", answer: "Hơn 270.000 quân chiến đấu, bao gồm 4 quân đoàn chủ lực và các binh đoàn độc lập.", status: "new" },
    ],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
    lastStudied: new Date(Date.now() - 1000 * 60 * 60 * 2),
    color: "#c9a84c",
  },
  {
    id: "deck2",
    title: "Nhà Lý và Nhà Trần",
    topic: "Lịch sử trung đại",
    description: "Hai triều đại phong kiến hùng mạnh nhất của Đại Việt từ thế kỷ XI–XIV",
    cards: [
      { id: "d2c1", question: "Nhà Lý được thành lập năm nào?", answer: "Năm 1009, khi Lý Công Uẩn lên ngôi, lấy hiệu là Lý Thái Tổ.", status: "mastered" },
      { id: "d2c2", question: "Bộ luật thành văn đầu tiên của Đại Việt tên là gì?", answer: "Hình thư, ban hành năm 1042 dưới triều vua Lý Thái Tông.", status: "mastered" },
      { id: "d2c3", question: "Quốc Tử Giám được thành lập năm nào?", answer: "Năm 1076 dưới triều Lý Nhân Tông, là trường đại học đầu tiên của Việt Nam.", status: "learning" },
      { id: "d2c4", question: "Nhà Trần 3 lần đánh thắng quân xâm lược nào?", answer: "Quân Mông – Nguyên (1258, 1285, 1288), trong đó trận Bạch Đằng 1288 là quyết định nhất.", status: "new" },
      { id: "d2c5", question: "Chiếu dời đô được ban hành năm nào và bởi ai?", answer: "Năm 1010 bởi vua Lý Thái Tổ, dời đô từ Hoa Lư về Đại La (Thăng Long).", status: "new" },
    ],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14),
    lastStudied: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
    color: "#6399ff",
  },
  {
    id: "deck3",
    title: "Phong trào yêu nước đầu TK XX",
    topic: "Lịch sử cận đại",
    description: "Các phong trào đấu tranh giành độc lập đầu thế kỷ XX và các lãnh tụ tiêu biểu",
    cards: [
      { id: "d3c1", question: "Phong trào Đông Du do ai khởi xướng và diễn ra vào năm nào?", answer: "Phan Bội Châu khởi xướng năm 1905, đưa thanh niên sang Nhật Bản học tập cứu nước.", status: "new" },
      { id: "d3c2", question: "Nguyễn Ái Quốc tìm ra con đường cứu nước tại đâu?", answer: "Tại Pháp, sau khi tiếp xúc với Luận cương về vấn đề dân tộc và thuộc địa của Lênin (1920).", status: "new" },
      { id: "d3c3", question: "Đảng Cộng sản Việt Nam được thành lập vào ngày nào?", answer: "3/2/1930 tại Cửu Long (Hương Cảng, Trung Quốc), do Nguyễn Ái Quốc chủ trì hội nghị hợp nhất.", status: "new" },
    ],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
    color: "#a06aff",
  },
];

export const POPULAR_TOPICS = [
  { id: "pt1", title: "Chiến dịch Điện Biên Phủ", period: "1954", description: "Trận quyết chiến chiến lược kết thúc cuộc kháng chiến chống Pháp", icon: "⚔️", color: "#c9a84c" },
  { id: "pt2", title: "Nhà nước Văn Lang – Âu Lạc", period: "257 TCN", description: "Nhà nước đầu tiên trong lịch sử dân tộc Việt Nam", icon: "🏛️", color: "#6399ff" },
  { id: "pt3", title: "Khởi nghĩa Hai Bà Trưng", period: "40–43 CN", description: "Cuộc khởi nghĩa đầu tiên của phụ nữ trong lịch sử dân tộc", icon: "🌟", color: "#ff6b9d" },
  { id: "pt4", title: "Thời kỳ Bắc thuộc", period: "179 TCN–938", description: "Hơn 1000 năm đấu tranh giành lại độc lập dân tộc", icon: "📜", color: "#a06aff" },
  { id: "pt5", title: "Phong trào Cần Vương", period: "1885–1896", description: "Phong trào yêu nước dưới ngọn cờ Cần vương của vua Hàm Nghi", icon: "👑", color: "#ff9a3c" },
  { id: "pt6", title: "Cách mạng tháng Tám 1945", period: "1945", description: "Cuộc cách mạng dân tộc dân chủ thành công rực rỡ nhất", icon: "🔥", color: "#4caf8c" },
];

export interface LessonSection {
  heading: string;
  body: string;
}

export interface LessonContent {
  id: string;
  title: string;
  subtitle: string;
  period: string;
  icon: string;
  color: string;
  category: string;
  readTime: number; // minutes
  overview: string;
  sections: LessonSection[];
  keyFigures: { name: string; role: string; years: string }[];
  timeline: { year: string; event: string }[];
  significance: string;
  suggestedQuestions: string[];
  relatedTopicIds: string[];
}

export const LESSON_CONTENTS: LessonContent[] = [
  {
    id: "pt1",
    title: "Chiến dịch Điện Biên Phủ",
    subtitle: "Trận quyết chiến chiến lược lịch sử",
    period: "1954",
    icon: "⚔️",
    color: "#c9a84c",
    category: "Kháng chiến chống Pháp",
    readTime: 12,
    overview:
      "Chiến dịch Điện Biên Phủ (13/3 – 7/5/1954) là trận quyết chiến chiến lược, đánh bại hoàn toàn ý chí xâm lược của thực dân Pháp, buộc Pháp phải ký kết Hiệp định Genève, chấm dứt cuộc chi���n tranh Đông Dương lần thứ nhất. Chiến thắng này gây chấn động thế giới và đánh dấu sự sụp đổ của chủ nghĩa thực dân cũ ở châu Á.",
    sections: [
      {
        heading: "Bối cảnh chiến dịch",
        body:
          "Năm 1953, Pháp cử tướng Henri Navarre sang chỉ huy với 'kế hoạch Navarre' nhằm giành thế chủ động chiến lược trong 18 tháng. Navarre xây dựng Điện Biên Phủ thành 'pháo đài bất khả xâm phạm' với hệ thống 49 cứ điểm, 16.200 quân tinh nhuệ, pháo binh và không quân hùng hậu, với tham vọng dụ quân Việt Minh vào đây để tiêu diệt.",
      },
      {
        heading: "Chuẩn bị và quyết sách chiến lược",
        body:
          "Bộ Chính trị Đảng Lao động Việt Nam quyết định mở chiến dịch. Tổng tư lệnh Võ Nguyên Giáp chỉ huy hơn 50.000 quân, kéo pháo vào trận địa qua những con đường núi hiểm trở. Quyết định thay đổi phương châm từ 'đánh nhanh, giải quyết nhanh' sang 'đánh chắc, tiến chắc' là bước ngoặt then chốt, dù rất khó khăn nhưng đúng đắn về chiến lược.",
      },
      {
        heading: "Diễn biến ba đợt tấn công",
        body:
          "**Đợt 1 (13–17/3/1954):** Tiêu diệt các cứ điểm Him Lam, Độc Lập, Bản Kéo — những vị trí tiền tiêu phía Bắc. Tướng Pháp De Castries choáng váng.\n\n**Đợt 2 (30/3–30/4/1954):** Đào hào vây lấn, siết chặt vòng vây, đánh chiếm các cao điểm phía Đông (E1, D1, A1...). Trận chiến giành cao điểm A1 kéo dài tới 55 ngày đêm.\n\n**Đợt 3 (1–7/5/1954):** Tổng công kích toàn bộ trận địa. Rạng sáng 7/5/1954, lá cờ Việt Minh tung bay trên nóc hầm De Castries, tướng De Castries cùng toàn bộ ban tham mưu đầu hàng.",
      },
      {
        heading: "Kết quả và ý nghĩa",
        body:
          "Sau 55 ngày đêm chiến đấu, toàn bộ tập đoàn cứ điểm Điện Biên Phủ bị tiêu diệt: 16.200 quân Pháp bị loại khỏi vòng chiến đấu, trong đó có 1 thiếu tướng, 16 đại tá bị bắt. Chiến thắng Điện Biên Phủ buộc Pháp ngồi vào bàn đàm phán, dẫn đến Hiệp định Genève (21/7/1954), chấm dứt 9 năm kháng chiến chống Pháp.",
      },
    ],
    keyFigures: [
      { name: "Đại tướng Võ Nguyên Giáp", role: "Tổng tư lệnh chiến dịch", years: "1911–2013" },
      { name: "Tướng Henri Navarre", role: "Chỉ huy quân Pháp tại Đông Dương", years: "1898–1983" },
      { name: "Tướng Christian de Castries", role: "Chỉ huy quân Pháp tại Điện Biên Phủ", years: "1902–1991" },
      { name: "Chủ tịch Hồ Chí Minh", role: "Lãnh đạo tối cao kháng chiến", years: "1890–1969" },
    ],
    timeline: [
      { year: "11/1953", event: "Pháp nhảy dù xuống Điện Biên Phủ, bắt đầu xây dựng pháo đài" },
      { year: "12/1953", event: "Bộ Chính trị quyết định mở chiến dịch Điện Biên Phủ" },
      { year: "13/3/1954", event: "Nổ súng tấn công đợt 1, tiêu diệt Him Lam, Độc Lập" },
      { year: "30/3/1954", event: "Bắt đầu đợt 2 – vây lấn, đào hào siết chặt" },
      { year: "1/5/1954", event: "Bắt đầu đợt 3 – tổng công kích" },
      { year: "7/5/1954", event: "Điện Biên Phủ thất thủ, De Castries đầu hàng" },
      { year: "21/7/1954", event: "Ký kết Hiệp định Genève, kết thúc chiến tranh Đông Dương" },
    ],
    significance:
      "Chiến thắng Điện Biên Phủ là một trong những chiến thắng vĩ đại nhất trong lịch sử chống ngoại xâm của dân tộc Việt Nam, đồng thời là sự kiện có tầm ảnh hưởng toàn cầu — lần đầu tiên một dân tộc thuộc địa đánh bại một đội quân thực dân châu Âu trong trận địa chiến. Sự kiện này đã truyền cảm hứng cho các phong trào giải phóng dân tộc trên toàn thế giới.",
    suggestedQuestions: [
      "Tại sao Võ Nguyên Giáp thay đổi phương châm từ 'đánh nhanh' sang 'đánh chắc'?",
      "Hiệp định Genève 1954 quy định điều gì về vĩ tuyến 17?",
      "Chiến thắng Điện Biên Phủ ảnh hưởng thế nào đến phong trào giải phóng dân tộc toàn cầu?",
    ],
    relatedTopicIds: ["pt5", "pt6"],
  },
  {
    id: "pt2",
    title: "Nhà nước Văn Lang – Âu Lạc",
    subtitle: "Khởi nguồn của quốc gia dân tộc Việt",
    period: "2879 TCN – 179 TCN",
    icon: "🏛️",
    color: "#6399ff",
    category: "Thời kỳ dựng nước",
    readTime: 10,
    overview:
      "Nhà nước Văn Lang của các vua Hùng (khoảng thế kỷ VII TCN – 258 TCN) và nhà nước Âu Lạc của An Dương Vương (257–179 TCN) là hai nhà nước đầu tiên trong lịch sử Việt Nam. Đây là thời kỳ đặt nền móng cho bản sắc văn hóa, tổ chức xã hội và ý thức dân tộc của người Việt.",
    sections: [
      {
        heading: "Nhà nước Văn Lang – Các vua Hùng",
        body:
          "Theo truyền thuyết, họ Hồng Bàng trị vì từ thời Kinh Dương Vương. Lạc Long Quân và Âu Cơ sinh ra trăm trứng nở thành trăm người con — 50 theo mẹ lên núi, 50 theo cha xuống biển. Người con cả lên làm vua, lập ra nước Văn Lang. Nhà nước Văn Lang có tổ chức gồm 15 bộ, vua gọi là Hùng Vương, các lạc tướng cai quản từng bộ. Kinh đô đặt tại Phong Châu (nay thuộc tỉnh Phú Thọ).",
      },
      {
        heading: "Thành tựu văn hóa thời Hùng Vương",
        body:
          "Nền văn minh sông Hồng đạt đỉnh cao với văn hóa Đông Sơn nổi tiếng: kỹ thuật đúc đồng điêu luyện, trống đồng Đông Sơn là biểu tượng văn hóa được thế giới công nhận. Người Việt cổ đã phát triển nông nghiệp lúa nước, dệt vải, làm gốm, có chữ viết sơ khai. Các lễ hội, tín ngưỡng thờ cúng tổ tiên, thần tự nhiên được hình thành.",
      },
      {
        heading: "Nhà nước Âu Lạc – An Dương Vương",
        body:
          "Năm 258 TCN, Thục Phán (An Dương Vương) thống nhất các bộ lạc Âu Việt và Lạc Việt, lập ra nước Âu Lạc. Ông xây thành Cổ Loa (Đông Anh, Hà Nội ngày nay) — một pháo đài quân sự độc đáo với nhiều vòng thành hình trôn ốc. Chế tạo nỏ liên châu 'thần cơ' là thành tựu quân sự vượt trội.",
      },
      {
        heading: "Sự sụp đổ của Âu Lạc",
        body:
          "Năm 179 TCN, Triệu Đà — vua nước Nam Việt — dùng mưu kế cho con trai là Trọng Thủy kết hôn với Mị Châu (con An Dương Vương) để đánh cắp bí mật nỏ thần. Sau khi có được bí mật, Triệu Đà đem quân tấn công. Không còn nỏ thần, An Dương Vương thất bại, Âu Lạc rơi vào tay Triệu Đà, mở ra nghìn năm Bắc thuộc đau thương.",
      },
    ],
    keyFigures: [
      { name: "Kinh Dương Vương", role: "Thủy tổ họ Hồng Bàng, ông nội Lạc Long Quân", years: "Truyền thuyết" },
      { name: "Lạc Long Quân & Âu Cơ", role: "Tổ phụ tổ mẫu của dân tộc Việt", years: "Truyền thuyết" },
      { name: "An Dương Vương (Thục Phán)", role: "Vua sáng lập nhà nước Âu Lạc", years: "? – 179 TCN" },
      { name: "Triệu Đà", role: "Vua Nam Việt, kẻ thôn tính Âu Lạc", years: "240–137 TCN" },
    ],
    timeline: [
      { year: "Thế kỷ VII TCN", event: "Hình thành nhà nước Văn Lang, các vua Hùng trị vì" },
      { year: "500–300 TCN", event: "Văn hóa Đông Sơn phát triển rực rỡ" },
      { year: "258 TCN", event: "An Dương Vương lập nước Âu Lạc, xây thành Cổ Loa" },
      { year: "179 TCN", event: "Triệu Đà thôn tính Âu Lạc, bắt đầu thời Bắc thuộc" },
    ],
    significance:
      "Nhà nước Văn Lang – Âu Lạc đặt nền móng cho bản sắc văn hóa dân tộc Việt: ngôn ngữ, phong tục, tín ngưỡng, kỹ thuật canh tác lúa nước. Ký ức về thời đại Hùng Vương trở thành sức mạnh tinh thần giúp dân tộc Việt kiên cường suốt hơn 1000 năm Bắc thuộc và nhiều cuộc kháng chiến về sau.",
    suggestedQuestions: [
      "Thành Cổ Loa được xây dựng như thế nào và có ý nghĩa chiến lược ra sao?",
      "Truyền thuyết Lạc Long Quân và Âu Cơ phản ánh điều gì về nguồn gốc dân tộc Việt?",
      "Vì sao nhà nước Âu Lạc lại sụp đổ trước Nam Việt?",
    ],
    relatedTopicIds: ["pt3", "pt4"],
  },
  {
    id: "pt3",
    title: "Khởi nghĩa Hai Bà Trưng",
    subtitle: "Ngọn lửa đầu tiên của ý chí độc lập",
    period: "40 – 43 CN",
    icon: "🌟",
    color: "#ff6b9d",
    category: "Thời kỳ Bắc thuộc",
    readTime: 8,
    overview:
      "Cuộc khởi nghĩa Hai Bà Trưng (năm 40 CN) là cuộc khởi nghĩa đầu tiên giành lại độc lập sau hơn 200 năm Bắc thuộc lần đầu. Trưng Trắc và Trưng Nhị lãnh ��ạo nghĩa quân đánh đuổi thái thú Tô Định, giải phóng 65 thành trì, lập ra nhà nước tự chủ kéo dài 3 năm. Cuộc khởi nghĩa là biểu tượng bất diệt của ý chí độc lập và vai trò của phụ nữ trong lịch sử dân tộc.",
    sections: [
      {
        heading: "Nguyên nhân khởi nghĩa",
        body:
          "Nhà Hán thống trị Giao Chỉ (Việt Nam) với chính sách đồng hóa tàn bạo, bóc lột nặng nề qua hệ thống thuế, tô, dịch. Thái thú Tô Định nổi tiếng tham lam và hung tàn. Thi Sách — chồng của Trưng Trắc và thủ lĩnh bộ lạc Mê Linh — bị Tô Định giết hại vì dám chống đối. Đây là giọt nước làm tràn ly, châm ngòi cho cuộc khởi nghĩa.",
      },
      {
        heading: "Diễn biến và thắng lợi",
        body:
          "Mùa xuân năm 40 CN, Trưng Trắc và Trưng Nhị phát lệnh khởi nghĩa tại Hát Môn (Hà Tây). Nghĩa quân nhanh chóng thu hút đông đảo các lạc tướng, lạc dân tham gia. Tô Định hoảng sợ bỏ chạy về nước. Nghĩa quân giải phóng 65 thành trì trên khắp Giao Chỉ. Trưng Trắc lên làm vua (Trưng Vương), đóng đô tại Mê Linh, xây dựng nhà nước tự chủ.",
      },
      {
        heading: "Cuộc phản công của nhà Hán",
        body:
          "Năm 42 CN, Hán Quang Vũ Đế cử danh tướng Mã Viện với 20.000 quân tinh nhuệ sang tái chinh phục. Mã Viện là người đã từng bình định nhiều vùng đất, rất dày dạn kinh nghiệm. Sau nhiều trận chiến ác liệt, năm 43 CN nghĩa quân thất bại. Hai Bà Trưng tuẫn tiết tại sông Hát (hoặc sông Lãng Bạc theo một số sử liệu), không để rơi vào tay giặc.",
      },
    ],
    keyFigures: [
      { name: "Trưng Trắc", role: "Người lãnh đạo khởi nghĩa, Trưng Vương", years: "? – 43 CN" },
      { name: "Trưng Nhị", role: "Em gái Trưng Trắc, đồng lãnh đạo", years: "? – 43 CN" },
      { name: "Tô Định", role: "Thái thú Giao Chỉ của nhà Hán, kẻ thù của nghĩa quân", years: "TK I CN" },
      { name: "Mã Viện", role: "Danh tướng Hán, tái chinh phục Giao Chỉ", years: "14 TCN – 49 CN" },
    ],
    timeline: [
      { year: "Năm 39 CN", event: "Thi Sách bị Tô Định giết hại" },
      { year: "Mùa xuân 40 CN", event: "Hai Bà Trưng phát lệnh khởi nghĩa tại Hát Môn" },
      { year: "40 CN", event: "Giải phóng 65 thành trì, Tô Định bỏ chạy" },
      { year: "40–43 CN", event: "Trưng Vương xây dựng nhà nước độc lập tại Mê Linh" },
      { year: "42 CN", event: "Mã Viện đem 20.000 quân sang tái chinh phục" },
      { year: "43 CN", event: "Hai Bà Trưng tuẫn tiết, kết thúc nền độc lập ngắn ngủi" },
    ],
    significance:
      "Cuộc khởi nghĩa Hai Bà Trưng tuy chỉ kéo dài 3 năm nhưng có ý nghĩa sâu sắc: chứng minh ý chí bất khuất của người Việt ngay từ những năm đầu Bắc thuộc; khẳng định vị trí đặc biệt của phụ nữ Việt Nam trong đấu tranh bảo vệ Tổ quốc; và trở thành nguồn cảm hứng cho hàng chục cuộc khởi nghĩa về sau.",
    suggestedQuestions: [
      "Vì sao Hai Bà Trưng có thể nhanh chóng tập hợp được lực lượng lớn như vậy?",
      "Nhà nước tự chủ của Trưng Vương được tổ chức như thế nào?",
      "Sự thất bại trước Mã Viện để lại bài học gì?",
    ],
    relatedTopicIds: ["pt4", "pt2"],
  },
  {
    id: "pt4",
    title: "Thời kỳ Bắc thuộc",
    subtitle: "Nghìn năm đấu tranh giành độc lập",
    period: "179 TCN – 938 CN",
    icon: "📜",
    color: "#a06aff",
    category: "Thời kỳ Bắc thuộc",
    readTime: 15,
    overview:
      "Thời kỳ Bắc thuộc kéo dài hơn 1000 năm (179 TCN – 938 CN) là giai đoạn thử thách khắc nghi��t nhất trong lịch sử dân tộc Việt Nam. Dù bị đô hộ bởi nhiều triều đại phong kiến phương Bắc (Hán, Đường, Tùy...), người Việt không ngừng đấu tranh, gìn giữ bản sắc dân tộc và liên tiếp nổi dậy giành lại độc lập. Chiến thắng Bạch Đằng năm 938 của Ngô Quyền chính thức kết thúc thời kỳ này.",
    sections: [
      {
        heading: "Chính sách cai trị của các triều đại phương Bắc",
        body:
          "Các triều đại phương Bắc áp dụng chính sách đồng hóa toàn diện: thay thế bộ máy lạc tướng người Việt bằng quan lại Hán, cưỡng bức học chữ Hán, tiếp thu văn hóa Hán, thu thuế nặng nề. Chính sách nô dịch nhằm biến Giao Chỉ thành một quận của Trung Quốc, xóa bỏ sắc thái riêng của người Việt.",
      },
      {
        heading: "Sức đề kháng văn hóa của người Việt",
        body:
          "Dù bị cai trị, người Việt vẫn bảo tồn tiếng Việt, phong tục tập quán, tín ngưỡng dân gian. Văn hóa Đông Sơn, nghề trồng lúa nước, thờ cúng tổ tiên... tiếp tục được duy trì trong tầng lớp nhân dân. Sự giao thoa văn hóa cũng tạo ra những biến chuyển tích cực: tiếp thu kỹ thuật canh tác, xây dựng, chữ viết.",
      },
      {
        heading: "Các cuộc khởi nghĩa tiêu biểu",
        body:
          "**Khởi nghĩa Hai Bà Trưng (40–43):** Lần đầu giành độc lập trong 3 năm.\n\n**Khởi nghĩa Bà Triệu (248):** Triệu Thị Trinh lãnh đạo khởi nghĩa, thất bại nhưng để lại hình tượng bất khuất 'tôi muốn cưỡi cơn gió mạnh, đạp sóng dữ, chém cá kình ở biển Đông'.\n\n**Khởi nghĩa Lý Bí (542–544):** Lý Bí lập ra nước Vạn Xuân, đặt nền độc lập kéo dài vài thập kỷ.\n\n**Khởi nghĩa Mai Thúc Loan (722):** Nổi dậy lớn ở vùng Hà Tĩnh.\n\n**Khởi nghĩa Phùng Hưng (791):** Giành quyền tự trị trong 8 năm.",
      },
      {
        heading: "Chiến thắng Bạch Đằng 938 – Kết thúc Bắc thuộc",
        body:
          "Năm 938, Ngô Quyền – vị tướng tài ba – nổi dậy chống lại Nam Hán. Ông bày trận cọc trên sông Bạch Đằng, dụ quân Nam Hán vào khi thủy triều lên cao rồi đánh úp khi triều rút. Hoàng tử Nam Hán Lưu Hoằng Tháo tử trận. Chiến thắng này chấm dứt hơn 1000 năm Bắc thuộc, mở ra kỷ nguyên độc lập tự chủ lâu dài của dân tộc Việt.",
      },
    ],
    keyFigures: [
      { name: "Hai Bà Trưng", role: "L��nh đạo khởi nghĩa đầu tiên (40 CN)", years: "? – 43 CN" },
      { name: "Bà Triệu (Triệu Thị Trinh)", role: "Anh hùng dân tộc, lãnh đạo khởi nghĩa 248", years: "226–248 CN" },
      { name: "Lý Bí (Lý Nam Đế)", role: "Lập nước Vạn Xuân, triều Lý tiền Lý", years: "503–548 CN" },
      { name: "Ngô Quyền", role: "Chiến thắng Bạch Đằng, chấm dứt Bắc thuộc", years: "898–944 CN" },
    ],
    timeline: [
      { year: "179 TCN", event: "Triệu Đà thôn tính Âu Lạc, bắt đầu Bắc thuộc lần I" },
      { year: "40–43 CN", event: "Khởi nghĩa Hai Bà Trưng" },
      { year: "248 CN", event: "Khởi nghĩa Bà Triệu" },
      { year: "542–603 CN", event: "Nhà Tiền Lý – nước Vạn Xuân (độc lập)" },
      { year: "722 CN", event: "Khởi nghĩa Mai Thúc Loan" },
      { year: "791 CN", event: "Khởi nghĩa Phùng Hưng" },
      { year: "938 CN", event: "Ngô Quyền đại thắng trên sông Bạch Đằng, kết thúc Bắc thuộc" },
    ],
    significance:
      "Nghìn năm Bắc thuộc không thể đồng hóa người Việt — đó là minh chứng hùng hồn nhất cho sức sống mãnh liệt của dân tộc. Ý thức dân tộc, tinh thần yêu nước và bản sắc văn hóa Việt được tôi luyện và củng cố trong suốt thời kỳ này, tạo nền tảng vững chắc cho nền văn minh Đại Việt sau này.",
    suggestedQuestions: [
      "Tại sao người Việt không bị đồng hóa dù bị Bắc thuộc hơn 1000 năm?",
      "Nước Vạn Xuân của Lý Nam Đế tồn tại như thế nào?",
      "Chiến thuật cọc gỗ trên sông Bạch Đằng của Ngô Quyền được thực hiện ra sao?",
    ],
    relatedTopicIds: ["pt2", "pt3"],
  },
  {
    id: "pt5",
    title: "Phong trào Cần Vương",
    subtitle: "Ngọn cờ kháng Pháp cuối thế kỷ XIX",
    period: "1885 – 1896",
    icon: "👑",
    color: "#ff9a3c",
    category: "Kháng chiến chống Pháp",
    readTime: 10,
    overview:
      "Phong trào Cần Vương (1885–1896) là phong trào đấu tranh vũ trang chống thực dân Pháp diễn ra dưới danh nghĩa 'Cần vương' (giúp vua). Sau khi triều đình Huế ký Hiệp ước Patenôtre (1884), vua Hàm Nghi và Tôn Thất Thuyết phát Chiếu Cần vương kêu gọi nhân dân nổi dậy. Phong trào lan rộng khắp Trung và Bắc Kỳ với nhiều cuộc khởi nghĩa anh dũng.",
    sections: [
      {
        heading: "Bối cảnh và nguyên nhân",
        body:
          "Sau khi Pháp hoàn thành đặt nền bảo hộ lên toàn bộ Việt Nam qua Hiệp ước Patenôtre (6/6/1884), một bộ phận triều đình và sĩ phu yêu nước không chịu khuất phục. Tôn Thất Thuyết — phụ chính đại thần kiên quyết chống Pháp — bí mật chuẩn bị lực lượng kháng chiến.",
      },
      {
        heading: "Chiếu Cần vương và phong trào bùng nổ",
        body:
          "Đêm 4 rạng ngày 5/7/1885, Tôn Thất Thuyết tổ chức tấn công bất ngờ vào đồn Mang Cá và tòa Khâm sứ Pháp tại Huế. Cuộc tấn công thất bại, Tôn Thất Thuyết đưa vua Hàm Nghi ra Quảng Trị. Tại đây, vua Hàm Nghi ký ban Chiếu Cần vương kêu gọi văn thân, sĩ phu và nhân dân cả nước đứng lên kháng Pháp.",
      },
      {
        heading: "Các cuộc khởi nghĩa tiêu biểu",
        body:
          "**Khởi nghĩa Ba Đình (1886–1887):** Phạm Bành và Đinh Công Tráng xây dựng căn cứ tại ba làng Mậu Thịnh, Thượng Thọ, Mỹ Khê (Thanh Hóa). Pháp phải dùng đại quân mới dẹp được.\n\n**Khởi nghĩa Hùng Lĩnh (1887–1892):** Tống Duy Tân lãnh đạo ở vùng Thanh Hóa.\n\n**Khởi nghĩa Hương Khê (1885–1895):** Phan Đình Phùng và Cao Thắng lãnh đạo tại Hà Tĩnh — đây là cuộc khởi nghĩa lớn nhất, kéo dài nhất và có tổ chức nhất trong phong trào Cần Vương.",
      },
      {
        heading: "Sự thất bại và ý nghĩa",
        body:
          "Phong trào Cần Vương thất bại do nhiều nguyên nhân: lực lượng yếu, vũ khí thô sơ, chưa có đường lối đúng đắn, thiếu sự thống nhất. Năm 1888, vua Hàm Nghi bị bắt; năm 1895, Phan Đình Phùng qua đời. Phong trào chính thức chấm dứt năm 1896 với sự thất bại của các lực lượng còn lại.",
      },
    ],
    keyFigures: [
      { name: "Vua Hàm Nghi", role: "Người phát Chiếu Cần vương, biểu tượng kháng Pháp", years: "1871–1943" },
      { name: "Tôn Thất Thuyết", role: "Phụ chính đại thần, người tổ chức kháng chiến", years: "1839–1913" },
      { name: "Phan Đình Phùng", role: "Lãnh đạo khởi nghĩa Hương Khê", years: "1847–1895" },
      { name: "Cao Thắng", role: "Phó tướng khởi nghĩa Hương Khê, chế tạo vũ khí", years: "1864–1893" },
    ],
    timeline: [
      { year: "6/6/1884", event: "Hiệp ước Patenôtre, Pháp bảo hộ toàn Việt Nam" },
      { year: "5/7/1885", event: "Tôn Thất Thuyết tổ chức phản công, vua Hàm Nghi xuất bôn" },
      { year: "13/7/1885", event: "Ban Chiếu Cần vương, phong trào bùng nổ toàn quốc" },
      { year: "1886–1887", event: "Khởi nghĩa Ba Đình thất bại" },
      { year: "1885–1895", event: "Khởi nghĩa Hương Khê của Phan Đình Phùng" },
      { year: "11/1888", event: "Vua Hàm Nghi bị bắt, đày sang Algeria" },
      { year: "1895–1896", event: "Phan Đình Phùng qua đời, phong trào tan rã" },
    ],
    significance:
      "Phong trào Cần Vương là biểu hiện hào hùng của tinh thần yêu nước và ý chí bất khuất của giai cấp sĩ phu phong kiến Việt Nam. Dù thất bại, phong trào đã làm chậm quá trình bình định của Pháp, để lại bài học quý về tổ chức và đường lối kháng chiến cho các thế hệ sau.",
    suggestedQuestions: [
      "Vì sao phong trào Cần Vương thất bại dù được đông đảo nhân dân ủng hộ?",
      "Khởi nghĩa Hương Khê khác gì so với các cuộc khởi nghĩa khác trong phong trào Cần Vương?",
      "Sự thất bại của phong trào Cần Vương có ảnh hưởng thế nào đến đường lối cứu nước sau này?",
    ],
    relatedTopicIds: ["pt6", "pt1"],
  },
  {
    id: "pt6",
    title: "Cách mạng tháng Tám 1945",
    subtitle: "Cuộc đổi đời vĩ đại của dân tộc",
    period: "Tháng 8/1945",
    icon: "🔥",
    color: "#4caf8c",
    category: "Lịch sử cận đại",
    readTime: 11,
    overview:
      "Cách mạng tháng Tám năm 1945 là cuộc cách mạng giải phóng dân tộc thành công rực rỡ nhất trong lịch sử Việt Nam. Trong vòng chưa đầy hai tuần (14–28/8/1945), dưới sự lãnh đạo của Đảng Cộng sản Đông Dương và Mặt trận Việt Minh, nhân dân cả nước đồng loạt nổi dậy, lật đổ chính quyền thực dân và phong kiến, lập ra nước Việt Nam Dân chủ Cộng hòa.",
    sections: [
      {
        heading: "Bối cảnh và điều kiện cách mạng",
        body:
          "Đến năm 1945, tình hình thế giới và trong nước có nhiều chuyển biến thuận lợi: Nhật Bản thất bại gần kề sau hai quả bom nguyên tử, Đồng minh sắp chiến thắng. Trong nước, nạn đói tháng 3 năm 1945 giết chết hơn 2 triệu người, tạo làn sóng căm phẫn cực độ trong nhân dân. Việt Minh đã xây dựng được lực lượng vũ trang và cơ sở quần chúng rộng khắp.",
      },
      {
        heading: "Nhật đảo chính Pháp và thời cơ vàng",
        body:
          "Ngày 9/3/1945, Nhật đảo chính Pháp trên toàn Đông Dương trong một đêm, đập tan huyền thoại 'bất khả chiến bại' của Pháp. Đảng Cộng sản Đông Dư��ng nhanh chóng ra Chỉ thị 'Nhật – Pháp bắn nhau và hành động của chúng ta', xác định Nhật là kẻ thù chính và chuẩn bị tổng khởi nghĩa.",
      },
      {
        heading: "Tổng khởi nghĩa và thắng lợi trong 2 tuần",
        body:
          "Ngày 14-15/8/1945, Nhật tuyên bố đầu hàng Đồng minh. Hội nghị toàn quốc của Đảng (14-15/8) quyết định Tổng khởi nghĩa. **19/8:** Hà Nội — 'Ngày Tổng khởi nghĩa' — hàng chục vạn người biểu tình, đánh chiếm Phủ Khâm sai, Trại Bảo an binh. **23/8:** Huế — Bảo Đại tuyên bố thoái vị, vương triều Nguyễn cáo chung. **25/8:** Sài Gòn — khởi nghĩa thành công. **28/8:** Cách mạng thắng lợi hoàn toàn trên cả nước.",
      },
      {
        heading: "Tuyên ngôn Độc lập 2/9/1945",
        body:
          "Ngày 2/9/1945, tại Quảng trường Ba Đình, Hà Nội, Chủ tịch Hồ Chí Minh đọc Tuyên ngôn Độc lập khai sinh ra nước Việt Nam Dân chủ Cộng hòa. Tuyên ngôn mở đầu bằng trích dẫn Tuyên ngôn Độc lập Mỹ và Tuyên ngôn Nhân quyền Pháp, khẳng định quyền tự nhiên của mọi dân tộc được hưởng tự do, độc lập.",
      },
    ],
    keyFigures: [
      { name: "Chủ tịch Hồ Chí Minh", role: "Lãnh tụ tối cao, đọc Tuyên ngôn Độc lập", years: "1890–1969" },
      { name: "Trường Chinh", role: "Tổng Bí thư, chỉ đạo Tổng khởi nghĩa", years: "1907–1988" },
      { name: "Võ Nguyên Giáp", role: "Tư lệnh Giải phóng quân Việt Nam", years: "1911–2013" },
      { name: "Vua Bảo Đại", role: "Vị vua cuối cùng nhà Nguyễn, tuyên bố thoái vị", years: "1913–1997" },
    ],
    timeline: [
      { year: "9/3/1945", event: "Nhật đảo chính Pháp trên toàn Đông Dương" },
      { year: "Tháng 3–7/1945", event: "Việt Minh mở rộng cơ sở, xây dựng khu giải phóng Việt Bắc" },
      { year: "14-15/8/1945", event: "Nhật đầu hàng Đồng minh, Đảng quyết định Tổng khởi nghĩa" },
      { year: "19/8/1945", event: "Khởi nghĩa thắng lợi tại Hà Nội" },
      { year: "23/8/1945", event: "Huế khởi nghĩa, Bảo Đại thoái vị" },
      { year: "25/8/1945", event: "Sài Gòn khởi nghĩa thành công" },
      { year: "2/9/1945", event: "Hồ Chí Minh đọc Tuyên ngôn Độc lập tại Ba Đình" },
    ],
    significance:
      "Cách mạng tháng Tám 1945 là sự kiện vĩ đại nhất trong lịch sử dân tộc Việt Nam thế kỷ XX: lật đổ ách thực dân gần 90 năm của Pháp và ách phát x��t Nhật, kết thúc chế độ quân chủ hàng nghìn năm, khai sinh nhà nước công nông đầu tiên ở Đông Nam Á. Thắng lợi này là điều kiện tiên quyết cho mọi thắng lợi về sau.",
    suggestedQuestions: [
      "Tại sao Cách mạng tháng Tám thành công nhanh chóng như vậy?",
      "Tuyên ngôn Độc lập 2/9/1945 có nội dung chính là gì?",
      "Nạn đói 1945 ảnh hưởng thế nào đến phong trào cách mạng?",
    ],
    relatedTopicIds: ["pt5", "pt1"],
  },
];

export const SIMULATED_RESPONSE = {
  content: `Đây là câu trả lời được tạo ra từ hệ thống RAG kết hợp tìm kiếm Hybrid Search. Hệ thống đã phân tích câu hỏi của bạn và truy xuất các đoạn văn bản liên quan từ kho tài liệu lịch sử được kiểm chứng.\n\n**Thông tin chính:**\nDựa trên các tài liệu trong cơ sở dữ liệu, câu trả lời được tổng hợp từ nhiều nguồn đáng tin cậy bao gồm sách giáo khoa, công trình nghiên cứu học thuật và tài liệu lưu trữ lịch sử.\n\nHệ thống sử dụng kết hợp hai phương pháp tìm kiếm: **Dense Retrieval** (tìm kiếm ngữ nghĩa bằng vector embedding) và **Sparse Retrieval** (BM25 keyword search) để đảm bảo độ chính xác và đầy đủ của thông tin được truy xuất.`,
  citations: [
    {
      id: "cs1",
      fileName: "Lịch sử Việt Nam – Tập 2.pdf",
      page: 145,
      chunkId: "chunk_0145_02",
      excerpt: "Đoạn trích từ tài liệu gốc liên quan đến câu hỏi của bạn, được truy xuất thông qua thuật toán Hybrid Search với điểm relevance cao nhất...",
    },
    {
      id: "cs2",
      fileName: "Đại cương Lịch sử Việt Nam – NXB Giáo Dục.pdf",
      page: 89,
      chunkId: "chunk_0089_01",
      excerpt: "Nguồn tham khảo thứ hai được hệ thống xác định là liên quan, cung cấp thêm góc nhìn học thuật về vấn đề đang được thảo luận...",
    },
  ],
  suggestedFlashcards: [
    {
      id: "sfq1",
      question: "RAG là viết tắt của gì?",
      answer: "RAG là viết tắt của Retrieval-Augmented Generation – Sinh ngôn ngữ tăng cường bằng truy xuất tài liệu.",
      status: "new" as const,
    },
    {
      id: "sfq2",
      question: "Hybrid Search kết hợp những phương pháp nào?",
      answer: "Hybrid Search kết hợp BM25 (sparse/keyword search) và Dense Retrieval (vector embedding search) để đạt độ chính xác cao hơn.",
      status: "new" as const,
    },
  ],
};