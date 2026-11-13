// Build additional form controls using DOM APIs only; never interpolate input as HTML.
const linkKinds = [
  ["menu", "🍽️ Menu / Thực đơn", "Liên kết menu hoặc PDF thực đơn"],
  ["pdf", "📄 Tài liệu PDF", "Đường dẫn tới tệp PDF đã được lưu trên web nội bộ hoặc hosting"],
  ["file", "📁 Tài liệu / Tệp tải xuống", "Đường dẫn tới tài liệu đã được hosting"],
  ["product", "📦 Trang sản phẩm", "Liên kết sản phẩm hoặc trang chi tiết"],
  ["catalog", "📚 Catalogue", "Liên kết catalogue đã xuất bản"],
  ["app", "📱 Ứng dụng / App Store", "Liên kết cửa hàng ứng dụng"],
  ["meeting", "🎥 Phòng họp trực tuyến", "Liên kết Zoom, Teams, Meet hoặc hệ thống họp nội bộ"],
  ["maps", "🗺️ Google Maps / Chỉ đường", "Liên kết bản đồ hoặc tuyến đường"],
  ["review", "⭐ Đánh giá / Google Review", "Liên kết trang đánh giá cụ thể"],
  ["video", "🎞️ Video", "Liên kết video trực tuyến hoặc nội bộ"],
  ["live", "📺 Livestream", "Liên kết phát trực tiếp"],
  ["booking", "🗓️ Đặt lịch / Đặt bàn", "Liên kết tới hệ thống đặt lịch"],
  ["form", "📝 Biểu mẫu khảo sát", "Liên kết Google Forms, Microsoft Forms hoặc biểu mẫu nội bộ"],
  ["feedback", "💬 Góp ý / Phản hồi", "Liên kết tới trang nhận phản hồi"],
  ["support", "🧰 Hỗ trợ / Helpdesk", "Liên kết cổng hỗ trợ GLPI, Zammad hoặc IT nội bộ"],
  ["payment", "💳 Cổng thanh toán / Payment Link", "Liên kết thanh toán hợp lệ từ nhà cung cấp"],
  ["download", "⬇️ Tải ứng dụng / Tệp", "Đường dẫn tải được quản trị"],
  ["ticket", "🎫 Vé / Check-in", "URL vé hoặc mã check-in được cung cấp bởi hệ thống vé"],
  ["portfolio", "🧑‍💻 Hồ sơ / Portfolio", "Liên kết hồ sơ cá nhân hoặc công ty"],
  ["album", "🖼️ Album ảnh", "Liên kết album nội bộ hoặc đã xuất bản"]
];
const socialPlatforms = [
  ["facebook","Facebook"],["instagram","Instagram"],["tiktok","TikTok"],
  ["youtube","YouTube"],["linkedin","LinkedIn"],["threads","Threads"],
  ["twitter","X / Twitter"],["telegram","Telegram"],["github","GitHub"],
  ["spotify","Spotify"],["pinterest","Pinterest"],["discord","Discord"],
  ["twitch","Twitch"],["reddit","Reddit"],["zalo","Zalo"],
  ["whatsapp","WhatsApp"],["snapchat","Snapchat"],["soundcloud","SoundCloud"],
  ["line","LINE"],["shopee","Shopee"],["lazada","Lazada"],
  ["googleplay","Google Play"],["appstore","Apple App Store"]
];
const opt = (value, label) => {
  const element = document.createElement("option");
  element.value = value;
  element.textContent = label;
  return element;
};
function addField(parent, cfg) {
  const label = document.createElement("label");
  label.textContent = cfg.label;
  const node = document.createElement(cfg.type === "textarea" ? "textarea" :
    cfg.type === "select" ? "select" : "input");
  node.dataset.field = cfg.key;
  if (cfg.type === "textarea") {
    node.rows = cfg.rows || 3;
    node.spellcheck = false;
  } else if (cfg.type === "select") {
    for (const [value, text] of cfg.options) node.appendChild(opt(value, text));
  } else {
    node.type = cfg.type || "text";
    node.autocomplete = "off";
    node.spellcheck = false;
  }
  if (cfg.type === "color") node.value = "#167b62";
  if (cfg.max) node.maxLength = cfg.max;
  if (cfg.placeholder) node.placeholder = cfg.placeholder;
  label.appendChild(node);
  parent.appendChild(label);
  return node;
}
function formFor(kind, fields, note) {
  const form = document.createElement("div");
  form.className = "type-form";
  form.dataset.type = kind;
  form.hidden = true;
  for (const cfg of fields) addField(form, cfg);
  if (note) {
    const hint = document.createElement("p");
    hint.className = "hint";
    hint.textContent = note;
    form.appendChild(hint);
  }
  document.querySelector(".form-stack").appendChild(form);
  return form;
}
export function registerExtraForms() {
  const select = document.getElementById("kind");
  const groupLanding = document.createElement("optgroup");
  groupLanding.label = "Landing page, hồ sơ & nội dung";
  groupLanding.appendChild(opt("landing", "🏠 Landing Page / Link-in-Bio"));
  groupLanding.appendChild(opt("social", "🌐 Mạng xã hội / Social"));
  groupLanding.appendChild(opt("coupon", "🏷️ Mã ưu đãi / Coupon"));
  select.appendChild(groupLanding);
  const groupLinks = document.createElement("optgroup");
  groupLinks.label = "Tài liệu, bán hàng & dịch vụ";
  for (const [kind, label] of linkKinds) groupLinks.appendChild(opt(kind, label));
  select.appendChild(groupLinks);
  const groupMoney = document.createElement("optgroup");
  groupMoney.label = "Chuyển khoản Việt Nam";
  groupMoney.appendChild(opt("vietqr", "🏦 VietQR — chuyển khoản nội địa (offline)"));
  select.appendChild(groupMoney);

  const landing = formFor("landing", [
    {key:"landingTemplate",label:"Mẫu landing page",type:"select",options:[
      ["links","Link-in-Bio / nhiều liên kết"],["business","Giới thiệu doanh nghiệp"],
      ["menu","Menu nhà hàng"],["product","Sản phẩm / Dịch vụ"],
      ["event","Sự kiện"],["portfolio","Portfolio"],["contact","Trang liên hệ"]
    ]},
    {key:"landingTitle",label:"Tiêu đề / Tên thương hiệu",max:100,placeholder:"CÔNG TY / TÊN CÁ NHÂN"},
    {key:"landingSubtitle",label:"Khẩu hiệu / Tiêu đề phụ",max:140,placeholder:"Giới thiệu ngắn"},
    {key:"landingDescription",label:"Mô tả",type:"textarea",max:900,rows:4,placeholder:"Giới thiệu sản phẩm, dịch vụ hoặc thông tin cần hiển thị…"},
    {key:"landingItems",label:"Danh sách sản phẩm / dịch vụ / món ăn (mỗi dòng một mục)",type:"textarea",max:1200,rows:4,placeholder:"Dịch vụ 1 — 100.000đ\nDịch vụ 2 — Liên hệ"},
    {key:"landingButton1Text",label:"Nút 1 — Nội dung",max:60,placeholder:"Xem website"},
    {key:"landingButton1Url",label:"Nút 1 — URL",max:300,placeholder:"https://example.com"},
    {key:"landingButton2Text",label:"Nút 2 — Nội dung",max:60,placeholder:"Liên hệ"},
    {key:"landingButton2Url",label:"Nút 2 — URL",max:300,placeholder:"https://example.com/contact"},
    {key:"landingButton3Text",label:"Nút 3 — Nội dung",max:60,placeholder:"Đặt lịch"},
    {key:"landingButton3Url",label:"Nút 3 — URL",max:300,placeholder:"https://example.com/booking"},
    {key:"landingPhone",label:"Số điện thoại liên hệ (tùy chọn)",type:"tel",max:32,placeholder:"+84901234567"},
    {key:"landingEmail",label:"Email liên hệ (tùy chọn)",type:"email",max:200,placeholder:"info@example.com"},
    {key:"landingAddress",label:"Địa chỉ (tùy chọn)",max:250,placeholder:"Địa chỉ cửa hàng / công ty"},
    {key:"landingAccent",label:"Màu landing page",type:"color"},
    {key:"landingUrl",label:"URL sau khi đăng trang HTML lên máy chủ",type:"url",max:500,placeholder:"https://landing.noi-bo.example/"},
  ], "Tạo và tải file HTML hoàn toàn offline. Muốn mã QR dẫn tới landing page, cần đăng file HTML lên web server/NAS nội bộ và điền URL thực tế. Không tự host, không theo dõi lượt quét.");
  const toolbar = document.createElement("div");
  toolbar.className = "landing-toolbar";
  const download = document.createElement("button");
  download.id = "landing-download";
  download.type = "button";
  download.textContent = "⬇️ Tải Landing Page HTML";
  const preview = document.createElement("button");
  preview.id = "landing-preview";
  preview.type = "button";
  preview.textContent = "👁️ Xem trước";
  toolbar.append(download,preview);
  const hint = document.createElement("p");
  hint.className = "hint warning";
  hint.id = "landing-notice";
  hint.textContent = "File HTML chỉ được tạo tại máy của mày. Để QR hoạt động, đăng file lên máy chủ nội bộ rồi điền URL.";
  landing.append(toolbar,hint);

  formFor("social", [
    {key:"socialPlatform",label:"Nền tảng",type:"select",options:socialPlatforms},
    {key:"socialUrl",label:"Đường dẫn trang cá nhân / cửa hàng / kênh",type:"url",max:500,placeholder:"https://facebook.com/yourpage"}
  ], "Để an toàn, nhập đúng URL của nền tảng đã chọn. QRFrame không truy cập hoặc kiểm tra trang bên ngoài.");

  formFor("coupon", [
    {key:"couponCode",label:"Mã ưu đãi",max:80,placeholder:"SALE2026"},
    {key:"couponExpiry",label:"Hạn sử dụng",max:60,placeholder:"31/12/2026"},
    {key:"couponNote",label:"Ghi chú / điều kiện",type:"textarea",max:400,rows:3,placeholder:"Áp dụng cho…"}
  ], "QR ưu đãi chứa văn bản. Việc xác thực và chống dùng lại cần hệ thống riêng; QR tĩnh không thể tự kiểm tra coupon.");

  for (const [kind,, description] of linkKinds) {
    formFor(kind, [{
      key:"targetUrl",label:"Đường dẫn (HTTP/HTTPS)",type:"url",
      max:1024,placeholder:"https://example.com/..."
    }], description + ". QR chỉ chứa liên kết: để người quét mở được tài liệu/trang, nội dung phải được hosting ở nơi họ có quyền truy cập.");
  }

  formFor("vietqr", [
    {key:"bankBin",label:"Mã BIN ngân hàng (6 số)",max:6,placeholder:"970436"},
    {key:"bankAccount",label:"Số tài khoản nhận tiền",max:19,placeholder:"0011001234567"},
    {key:"bankAmount",label:"Số tiền VND (tùy chọn, nhập số nguyên)",max:12,placeholder:"150000"},
    {key:"bankNote",label:"Nội dung chuyển khoản không dấu (tùy chọn)",max:25,placeholder:"THANH TOAN 2026"},
  ], "Tạo chuỗi VietQR EMVCo/NAPAS trực tiếp offline — không liên hệ ngân hàng. Nhập đúng BIN và STK, quét thử bằng app ngân hàng để xác nhận tên người nhận trước khi chuyển tiền. QR KHÔNG tự thực hiện giao dịch.");
}
