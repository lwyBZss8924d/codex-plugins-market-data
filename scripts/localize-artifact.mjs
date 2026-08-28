#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const inputPath = resolve(process.argv[2] ?? "artifact.json");
const outputDir = resolve(process.argv[3] ?? "i18n");
const source = JSON.parse(await readFile(inputPath, "utf8"));

const lexicon = {
  "Codex | ChatGPT Plugins Index": {
    zh: "Codex | ChatGPT 插件索引",
    ja: "Codex | ChatGPT プラグイン索引",
    ko: "Codex | ChatGPT 플러그인 인덱스",
  },
  "Skills / Plugins / Apps Package Market Data Insights — a reproducible, metadata-backed market index.": {
    zh: "Skills / Plugins / Apps 包市场数据洞察——可复现、基于元数据的市场索引。",
    ja: "Skills / Plugins / Apps パッケージ市場データ分析 — 再現可能なメタデータ基盤の市場索引。",
    ko: "Skills / Plugins / Apps 패키지 시장 데이터 인사이트 — 재현 가능한 메타데이터 기반 시장 인덱스.",
  },
  "Skills / Plugins / Apps Package Market Data Insights": {
    zh: "Skills / Plugins / Apps 包市场数据洞察",
    ja: "Skills / Plugins / Apps パッケージ市場データ分析",
    ko: "Skills / Plugins / Apps 패키지 시장 데이터 인사이트",
  },
  "Universal directory": { zh: "通用目录", ja: "ユニバーサルディレクトリ", ko: "유니버설 디렉터리" },
  "CLI catalog rows": { zh: "CLI 目录行数", ja: "CLI カタログ行", ko: "CLI 카탈로그 행" },
  "Git marketplace": { zh: "Git 市场", ja: "Git マーケットプレイス", ko: "Git 마켓플레이스" },
  "Skill entrypoints": { zh: "Skill 入口", ja: "Skill エントリポイント", ko: "Skill 진입점" },
  "Unique App ids": { zh: "唯一 App ID", ja: "一意の App ID", ko: "고유 App ID" },
  "API-key subset": { zh: "API-key 子集", ja: "API-key サブセット", ko: "API-key 하위 집합" },
  "Plugins with skills": { zh: "含 Skills 的插件", ja: "Skills を含むプラグイン", ko: "Skills 포함 플러그인" },
  "App references": { zh: "App 引用", ja: "App 参照", ko: "App 참조" },
  "Hidden bundles": { zh: "隐藏的 bundled 行", ja: "非表示 bundled 行", ko: "숨겨진 bundled 행" },
  "Hidden bundled rows": { zh: "隐藏的 bundled 行", ja: "非表示 bundled 行", ko: "숨겨진 bundled 행" },
  "Raw App Server": { zh: "原始 App Server", ja: "App Server 生データ", ko: "원시 App Server" },
  "PTY visible": { zh: "PTY 可见", ja: "PTY 表示", ko: "PTY 표시" },
  "Top 2 category share": { zh: "前 2 类别占比", ja: "上位2カテゴリ比率", ko: "상위 2개 카테고리 비중" },
  "Developer Tools share": { zh: "Developer Tools 占比", ja: "Developer Tools 比率", ko: "Developer Tools 비중" },
  "API-key coverage": { zh: "API-key 覆盖率", ja: "API-key カバレッジ", ko: "API-key 커버리지" },
  "Third-party share": { zh: "第三方占比", ja: "サードパーティ比率", ko: "서드파티 비중" },
  "Third-party plugins": { zh: "第三方插件", ja: "サードパーティプラグイン", ko: "서드파티 플러그인" },
  "Third-party providers": { zh: "第三方 Provider", ja: "サードパーティプロバイダー", ko: "서드파티 제공자" },
  "Website coverage": { zh: "网站覆盖率", ja: "Webサイトカバレッジ", ko: "웹사이트 커버리지" },
  "Git third-party share": { zh: "Git 第三方占比", ja: "Git サードパーティ比率", ko: "Git 서드파티 비중" },
  "Third-party App refs": { zh: "第三方 App 引用", ja: "サードパーティ App 参照", ko: "서드파티 App 참조" },
  "Linked rows": { zh: "含链接行", ja: "リンク付き行", ko: "링크 포함 행" },
  "Third-party packages": { zh: "第三方包", ja: "サードパーティパッケージ", ko: "서드파티 패키지" },
  "Third-party refs": { zh: "第三方引用", ja: "サードパーティ参照", ko: "서드파티 참조" },
  "All App refs": { zh: "全部 App 引用", ja: "全 App 参照", ko: "전체 App 참조" },
  "Inventory plane": { zh: "库存平面", ja: "インベントリ平面", ko: "인벤토리 프로젝션" },
  "Package surface": { zh: "包能力面", ja: "パッケージ面", ko: "패키지 표면" },
  "Interface layer": { zh: "接口层", ja: "インターフェース層", ko: "인터페이스 계층" },
  "Methods / commands": { zh: "方法 / 命令", ja: "メソッド / コマンド", ko: "메서드 / 명령" },
  "Metadata URL": { zh: "元数据 URL", ja: "メタデータ URL", ko: "메타데이터 URL" },
  "Share of universal directory": { zh: "通用目录占比", ja: "ユニバーサルディレクトリ比率", ko: "유니버설 디렉터리 비중" },
  "Share of Git marketplace": { zh: "Git 市场占比", ja: "Git マーケットプレイス比率", ko: "Git 마켓 비중" },
  "Relative emphasis": { zh: "相对侧重", ja: "相対的な重点", ko: "상대적 강조" },
  "Universal share": { zh: "通用目录占比", ja: "ユニバーサル比率", ko: "유니버설 비중" },
  "Git share": { zh: "Git 占比", ja: "Git 比率", ko: "Git 비중" },
  "Universal count": { zh: "通用目录数量", ja: "ユニバーサル件数", ko: "유니버설 수" },
  "Git count": { zh: "Git 数量", ja: "Git 件数", ko: "Git 수" },
  "Git minus universal": { zh: "Git 减通用目录", ja: "Git − ユニバーサル", ko: "Git − 유니버설" },
  "Immediate skill entrypoints": { zh: "即时 Skill 入口", ja: "直接 Skill エントリポイント", ko: "직접 Skill 진입점" },
  "App refs": { zh: "App 引用", ja: "App 参照", ko: "App 참조" },
  "MCP configs": { zh: "MCP 配置", ja: "MCP 設定", ko: "MCP 구성" },
  "Provider scope": { zh: "Provider 范围", ja: "プロバイダー範囲", ko: "제공자 범위" },
  "URL metadata": { zh: "URL 元数据", ja: "URL メタデータ", ko: "URL 메타데이터" },
  "fractional share": { zh: "比例占比", ja: "比率", ko: "분수 비중" },
  "plugin package": { zh: "插件包", ja: "プラグインパッケージ", ko: "플러그인 패키지" },
  "62 standard marketplace packages": { zh: "62 个标准市场包", ja: "標準マーケットプレイス 62 パッケージ", ko: "표준 마켓플레이스 62개 패키지" },
  "package surface counts": { zh: "包能力面计数", ja: "パッケージ面の件数", ko: "패키지 표면 수" },
  "App Server raw default": { zh: "App Server 原始默认目录", ja: "App Server 生デフォルト", ko: "App Server 원시 기본값" },
  "PTY universal directory": { zh: "PTY 通用目录", ja: "PTY ユニバーサルディレクトリ", ko: "PTY 유니버설 디렉터리" },
  "CLI marketplace catalogs": { zh: "CLI 市场目录", ja: "CLI マーケットプレイスカタログ", ko: "CLI 마켓플레이스 카탈로그" },
  "Official Git marketplace": { zh: "官方 Git 市场", ja: "公式 Git マーケットプレイス", ko: "공식 Git 마켓플레이스" },
  "API-key Git marketplace": { zh: "API-key Git 市场", ja: "API-key Git マーケットプレイス", ko: "API-key Git 마켓플레이스" },
  "User-visible /plugins directory after the TUI hides CLI-only bundles.": {
    zh: "TUI 隐藏仅供 CLI 使用的 bundled 包后，用户可见的 /plugins 目录。",
    ja: "TUI が CLI 専用 bundled を除外した後の、ユーザー表示用 /plugins ディレクトリ。",
    ko: "TUI가 CLI 전용 bundled를 숨긴 뒤 사용자에게 표시되는 /plugins 디렉터리."
  },
  "Configured marketplace catalog rows visible to the plugin CLI command.": {
    zh: "插件 CLI 命令可见的已配置市场目录行。",
    ja: "プラグイン CLI コマンドに表示される設定済みマーケットカタログ行。",
    ko: "플러그인 CLI 명령에 표시되는 구성된 마켓 카탈로그 행."
  },
  "Standard curated marketplace and its API-key-compatible subset.": {
    zh: "标准 curated 市场及其兼容 API-key 的子集。",
    ja: "標準 curated マーケットプレイスと API-key 互換サブセット。",
    ko: "표준 curated 마켓플레이스와 API-key 호환 하위 집합."
  },
  "Immediate reusable skill entrypoints across plugins that contain skills directories.": {
    zh: "含 skills 目录插件中的即时可复用 Skill 入口。",
    ja: "skills ディレクトリを持つプラグインの直接再利用可能な Skill エントリポイント。",
    ko: "skills 디렉터리가 있는 플러그인의 직접 재사용 가능한 Skill 진입점."
  },
  "App references and distinct App ids declared by official Git marketplace packages.": {
    zh: "官方 Git 市场包声明的 App 引用和唯一 App ID。",
    ja: "公式 Git マーケットプレイスパッケージが宣言する App 参照と一意の App ID。",
    ko: "공식 Git 마켓플레이스 패키지가 선언한 App 참조와 고유 App ID."
  },
  "Exact adjustment from the raw App Server response to the TUI-visible catalog.": {
    zh: "从 App Server 原始响应到 TUI 可见目录的准确调整。",
    ja: "App Server 生レスポンスから TUI 表示カタログへの正確な調整。",
    ko: "App Server 원시 응답에서 TUI 표시 카탈로그까지의 정확한 조정."
  },
  "Exact adjustment from the raw App Server catalog to the TUI-visible market view.": {
    zh: "从 App Server 原始目录到 TUI 可见市场视图的准确调整。",
    ja: "App Server 生カタログから TUI 表示市場ビューへの正確な調整。",
    ko: "App Server 원시 카탈로그에서 TUI 표시 시장 보기까지의 정확한 조정."
  },
  "Share of the live catalog in Productivity and Business & Operations.": {
    zh: "实时目录中生产力与业务和运营两类的占比。",
    ja: "ライブカタログにおける生産性とビジネス＆運用の比率。",
    ko: "라이브 카탈로그에서 생산성 및 비즈니스·운영이 차지하는 비중."
  },
  "Developer Tools share of the standard openai/plugins marketplace.": {
    zh: "标准 openai/plugins 市场中开发者工具的占比。",
    ja: "標準 openai/plugins マーケットプレイスにおける開発者ツールの比率。",
    ko: "표준 openai/plugins 마켓플레이스에서 개발자 도구의 비중."
  },
  "Name-level coverage of the standard Git marketplace in the API-key subset.": {
    zh: "API-key 子集对标准 Git 市场的名称级覆盖率。",
    ja: "API-key サブセットによる標準 Git マーケットプレイスの名前単位カバレッジ。",
    ko: "API-key 하위 집합의 표준 Git 마켓 이름 단위 커버리지."
  },
  "Universal-directory plugins with a named non-OpenAI developer provider.": {
    zh: "通用目录中具有明确非 OpenAI 开发者 Provider 的插件。",
    ja: "明示された非 OpenAI 開発プロバイダーを持つユニバーサルディレクトリのプラグイン。",
    ko: "명시된 비 OpenAI 개발자 제공자가 있는 유니버설 디렉터리 플러그인."
  },
  "Distinct named third-party developer providers in the live catalog.": {
    zh: "实时目录中名称明确且去重的第三方开发者 Provider。",
    ja: "ライブカタログ内の名前付きサードパーティ開発プロバイダーの重複除外数。",
    ko: "라이브 카탈로그의 고유한 명시적 서드파티 개발자 제공자."
  },
  "Universal-directory plugin rows with an exact metadata website URL.": {
    zh: "具有准确元数据网站 URL 的通用目录插件行。",
    ja: "正確なメタデータ Web サイト URL を持つユニバーサルディレクトリ行。",
    ko: "정확한 메타데이터 웹사이트 URL이 있는 유니버설 디렉터리 플러그인 행."
  },
  "Official Git packages whose manifest developer/author is non-OpenAI.": {
    zh: "清单 developer/author 为非 OpenAI 的官方 Git 包。",
    ja: "マニフェストの developer/author が非 OpenAI の公式 Git パッケージ。",
    ko: "매니페스트 developer/author가 비 OpenAI인 공식 Git 패키지."
  },
  "Git .app.json references contributed by third-party package providers.": {
    zh: "第三方包 Provider 贡献的 Git .app.json 引用。",
    ja: "サードパーティパッケージプロバイダーによる Git .app.json 参照。",
    ko: "서드파티 패키지 제공자가 기여한 Git .app.json 참조."
  },
  "Plugin inventory by market source": { zh: "按市场来源统计的插件库存", ja: "市場ソース別プラグインインベントリ", ko: "시장 출처별 플러그인 인벤토리" },
  "Universal directory plugins by category": { zh: "通用目录插件类别分布", ja: "ユニバーサルディレクトリのカテゴリ分布", ko: "유니버설 디렉터리 카테고리 분포" },
  "Third-party plugins by category": { zh: "第三方插件类别分布", ja: "サードパーティプラグインのカテゴリ分布", ko: "서드파티 플러그인 카테고리 분포" },
  "Top third-party providers by plugin count": { zh: "按插件数排名的第三方 Provider", ja: "プラグイン数上位のサードパーティプロバイダー", ko: "플러그인 수 기준 상위 서드파티 제공자" },
  "Category share: universal directory vs Git marketplace": { zh: "类别占比：通用目录 vs Git 市场", ja: "カテゴリ比率：ユニバーサル vs Git", ko: "카테고리 비중: 유니버설 vs Git" },
  "CLI catalog rows by configured marketplace": { zh: "各已配置市场的 CLI 目录行数", ja: "設定済みマーケット別 CLI カタログ行", ko: "구성된 마켓별 CLI 카탈로그 행" },
  "Plugin package surface counts": { zh: "插件包能力面计数", ja: "プラグインパッケージ面の件数", ko: "플러그인 패키지 표면 수" },
  "Package structure: Skills vs Apps": { zh: "包结构：Skills vs Apps", ja: "パッケージ構造：Skills vs Apps", ko: "패키지 구조: Skills vs Apps" },
  "Package architecture by capability mix": { zh: "按能力组合划分的包架构", ja: "能力構成別パッケージアーキテクチャ", ko: "기능 조합별 패키지 아키텍처" },
  "Codex plugin interfaces by layer": { zh: "Codex 插件接口层级", ja: "Codex プラグインのインターフェース層", ko: "Codex 플러그인 인터페이스 계층" },
  "Standard marketplace entries excluded from the API-key subset": { zh: "被 API-key 子集排除的标准市场条目", ja: "API-key サブセットから除外された標準市場項目", ko: "API-key 하위 집합에서 제외된 표준 마켓 항목" },
  "Category": { zh: "类别", ja: "カテゴリ", ko: "카테고리" },
  "Provider": { zh: "Provider", ja: "プロバイダー", ko: "제공자" },
  "Plugins": { zh: "插件", ja: "プラグイン", ko: "플러그인" },
  "Packages": { zh: "包", ja: "パッケージ", ko: "패키지" },
  "Rows": { zh: "行数", ja: "行", ko: "행" },
  "Count": { zh: "数量", ja: "件数", ko: "수" },
  "Marketplace": { zh: "市场", ja: "マーケットプレイス", ko: "마켓플레이스" },
  "Market source / view": { zh: "市场来源 / 目录视图", ja: "市場ソース / カタログ表示", ko: "시장 출처 / 카탈로그 보기" },
  "Capability archetype": { zh: "能力架构类型", ja: "能力アーキタイプ", ko: "기능 아키타입" },
  "Marketplace share": { zh: "市场占比", ja: "マーケットプレイス比率", ko: "마켓플레이스 비중" },
  "OpenAI packages": { zh: "OpenAI 包", ja: "OpenAI パッケージ", ko: "OpenAI 패키지" },
  "Examples": { zh: "示例", ja: "例", ko: "예시" },
  "Skills only": { zh: "仅 Skills", ja: "Skills のみ", ko: "Skills 전용" },
  "Skills + Apps + MCP": { zh: "Skills + Apps + MCP", ja: "Skills + Apps + MCP", ko: "Skills + Apps + MCP" },
  "Apps + MCP": { zh: "Apps + MCP", ja: "Apps + MCP", ko: "Apps + MCP" },
  "Apps only": { zh: "仅 Apps", ja: "Apps のみ", ko: "Apps 전용" },
  "Skills + MCP": { zh: "Skills + MCP", ja: "Skills + MCP", ko: "Skills + MCP" },
  "Skills + Apps": { zh: "Skills + Apps", ja: "Skills + Apps", ko: "Skills + Apps" },
  "Plugin": { zh: "插件", ja: "プラグイン", ko: "플러그인" },
  "Standard": { zh: "标准", ja: "標準", ko: "표준" },
  "API key": { zh: "API key", ja: "API key", ko: "API key" },
  "Included": { zh: "已包含", ja: "含む", ko: "포함" },
  "Excluded": { zh: "已排除", ja: "除外", ko: "제외" },
  "Productivity": { zh: "生产力", ja: "生産性", ko: "생산성" },
  "Business & Operations": { zh: "业务与运营", ja: "ビジネス＆運用", ko: "비즈니스 및 운영" },
  "Developer Tools": { zh: "开发者工具", ja: "開発者ツール", ko: "개발자 도구" },
  "Education & Research": { zh: "教育与研究", ja: "教育・研究", ko: "교육 및 연구" },
  "Data & Analytics": { zh: "数据与分析", ja: "データ＆分析", ko: "데이터 및 분석" },
  "Creativity": { zh: "创意", ja: "クリエイティブ", ko: "크리에이티브" },
  "Entertainment": { zh: "娱乐", ja: "エンターテインメント", ko: "엔터테인먼트" },
  "Healthcare": { zh: "医疗健康", ja: "ヘルスケア", ko: "헬스케어" },
  "Communication": { zh: "沟通", ja: "コミュニケーション", ko: "커뮤니케이션" },
  "Security": { zh: "安全", ja: "セキュリティ", ko: "보안" },
  "Scientific Research": { zh: "科学研究", ja: "科学研究", ko: "과학 연구" },
  "Finance": { zh: "金融", ja: "金融", ko: "금융" },
  "Travel": { zh: "旅行", ja: "旅行", ko: "여행" },
  "Other": { zh: "其他", ja: "その他", ko: "기타" },
  "Third-party": { zh: "第三方", ja: "サードパーティ", ko: "서드파티" },
  "Unspecified": { zh: "未指定", ja: "未指定", ko: "미지정" },
  "Git over-index": { zh: "Git 高占比", ja: "Git 高比率", ko: "Git 과대 비중" },
  "Universal over-index": { zh: "通用目录高占比", ja: "ユニバーサル高比率", ko: "유니버설 과대 비중" },
  "Near parity": { zh: "接近持平", ja: "ほぼ同等", ko: "유사 비중" },
  "Five distinct market sources and catalog views; exact origin and freshness remain in the tooltip and data source.": {
    zh: "五个不同的市场来源与目录视图；准确来源和新鲜度保留在提示与数据来源中。",
    ja: "異なる5つの市場ソースとカタログ表示。正確な出所と鮮度はツールチップとデータソースに保持されます。",
    ko: "서로 다른 5개 시장 출처와 카탈로그 보기이며 정확한 출처와 최신성은 툴팁과 데이터 소스에 유지됩니다."
  },
  "Bounded top 8; provider identity and URLs come directly from catalog metadata.": {
    zh: "限定前 8 名；Provider 身份与 URL 直接来自目录元数据。",
    ja: "上位8件に限定。プロバイダー識別情報と URL はカタログメタデータから直接取得。",
    ko: "상위 8개로 제한하며 제공자 식별 정보와 URL은 카탈로그 메타데이터에서 직접 가져옵니다."
  },
  "Counts are overlapping inventories, not parts of a whole.": {
    zh: "这些计数是可重叠的库存，不是整体的互斥部分。",
    ja: "件数は重複可能なインベントリであり、全体の排他的な構成要素ではありません。",
    ko: "수치는 중복 가능한 인벤토리이며 전체를 나눈 상호 배타적 부분이 아닙니다."
  },
  "Six CLI, TUI, request, and notification layers; exact methods remain available in the source data preview.": {
    zh: "六个 CLI、TUI、请求和通知层；准确方法保留在来源数据预览中。",
    ja: "CLI、TUI、リクエスト、通知の6層。正確なメソッドはソースデータプレビューで確認できます。",
    ko: "CLI, TUI, 요청, 알림의 6개 계층이며 정확한 메서드는 소스 데이터 미리보기에서 확인할 수 있습니다."
  },
  "How does category emphasis differ between the universal directory and Git marketplace?": {
    zh: "通用目录与 Git 市场的类别侧重有何不同？",
    ja: "ユニバーサルディレクトリと Git マーケットプレイスでカテゴリの重点はどう異なるか？",
    ko: "유니버설 디렉터리와 Git 마켓플레이스의 카테고리 강조는 어떻게 다른가?"
  },
  "How do official Git packages combine Skills, Apps, and MCP surfaces?": {
    zh: "官方 Git 包如何组合 Skills、Apps 与 MCP 能力面？",
    ja: "公式 Git パッケージは Skills、Apps、MCP 面をどう組み合わせるか？",
    ko: "공식 Git 패키지는 Skills, Apps, MCP 표면을 어떻게 결합하는가?"
  },
  "A mutually exclusive archetype distribution makes the package composition legible without overplotting sixty-two package points.": {
    zh: "互斥的架构类型分布无需叠加 62 个包级点，即可清晰呈现包组成。",
    ja: "相互排他的なアーキタイプ分布により、62個のパッケージ点を重ねずに構成を読み取れます。",
    ko: "상호 배타적 아키타입 분포로 62개 패키지 점을 겹치지 않고 구성을 명확히 읽을 수 있습니다."
  },
  "Audit headline metrics": { zh: "审计核心指标", ja: "監査主要指標", ko: "감사 핵심 지표" },
  "Market-source reconciliation": { zh: "市场来源对账", ja: "市場ソース照合", ko: "시장 출처 대조" },
  "TUI-visible plugin categories": { zh: "TUI 可见插件类别", ja: "TUI 表示プラグインカテゴリ", ko: "TUI 표시 플러그인 카테고리" },
  "Third-party provider categories": { zh: "第三方 Provider 类别", ja: "サードパーティプロバイダーカテゴリ", ko: "서드파티 제공자 카테고리" },
  "Top third-party providers": { zh: "头部第三方 Provider", ja: "上位サードパーティプロバイダー", ko: "상위 서드파티 제공자" },
  "Cross-market category positioning": { zh: "跨市场类别定位", ja: "市場間カテゴリポジショニング", ko: "시장 간 카테고리 포지셔닝" },
  "Package capability archetypes": { zh: "包能力架构类型", ja: "パッケージ能力アーキタイプ", ko: "패키지 기능 아키타입" },
  "CLI marketplace catalog rows": { zh: "CLI 市场目录行", ja: "CLI マーケットカタログ行", ko: "CLI 마켓 카탈로그 행" },
  "Plugin package surface comparison": { zh: "插件包能力面对比", ja: "プラグインパッケージ面比較", ko: "플러그인 패키지 표면 비교" },
  "Official Git package capability index": { zh: "官方 Git 包能力索引", ja: "公式 Git パッケージ能力索引", ko: "공식 Git 패키지 기능 인덱스" },
  "Codex plugin interface inventory": { zh: "Codex 插件接口库存", ja: "Codex プラグインインターフェース一覧", ko: "Codex 플러그인 인터페이스 인벤토리" },
  "API-key marketplace exclusions": { zh: "API-key 市场排除项", ja: "API-key マーケットプレイス除外", ko: "API-key 마켓 제외 항목" },
  "Direct Codex PTY /plugins observation": { zh: "Codex PTY /plugins 直接观测", ja: "Codex PTY /plugins 直接観測", ko: "Codex PTY /plugins 직접 관측" },
  "Official OpenAI Plugins documentation": { zh: "OpenAI 官方插件文档", ja: "OpenAI 公式プラグイン文書", ko: "OpenAI 공식 플러그인 문서" },
  "Each headline retains the denominator of its named market source or catalog view.": {
    zh: "每个核心指标都保留其所指市场来源或目录视图的分母。",
    ja: "各主要指標は、指定された市場ソースまたはカタログ表示の分母を保持します。",
    ko: "각 핵심 지표는 해당 시장 출처 또는 카탈로그 보기의 분모를 유지합니다."
  },
};

const phraseLexicon = {
  "## Skills / Plugins / Apps Package Market Data Insights": {
    zh: "## Skills / Plugins / Apps 包市场数据洞察",
    ja: "## Skills / Plugins / Apps パッケージ市場データ分析",
    ko: "## Skills / Plugins / Apps 패키지 시장 데이터 인사이트",
  },
  "## ◇ CLI catalog sources": { zh: "## ◇ CLI 目录来源", ja: "## ◇ CLI カタログソース", ko: "## ◇ CLI 카탈로그 소스" },
  "## ◉ Live mix": { zh: "## ◉ 实时构成", ja: "## ◉ ライブ構成", ko: "## ◉ 라이브 구성" },
  "## ◎ Provider ecosystem": { zh: "## ◎ Provider 生态", ja: "## ◎ プロバイダーエコシステム", ko: "## ◎ 제공자 생태계" },
  "## ◎ Third-party category breadth": { zh: "## ◎ 第三方类别广度", ja: "## ◎ サードパーティのカテゴリ幅", ko: "## ◎ 서드파티 카테고리 범위" },
  "## ↗ Provider concentration": { zh: "## ↗ Provider 集中度", ja: "## ↗ プロバイダー集中度", ko: "## ↗ 제공자 집중도" },
  "### ↗ Provider metadata links": { zh: "### ↗ Provider 元数据链接", ja: "### ↗ プロバイダーメタデータリンク", ko: "### ↗ 제공자 메타데이터 링크" },
  "## ◆ Cross-market emphasis": { zh: "## ◆ 跨市场侧重", ja: "## ◆ 市場間の重点", ko: "## ◆ 시장 간 강조" },
  "## ▦ Capability surface": { zh: "## ▦ 能力面", ja: "## ▦ ケイパビリティ面", ko: "## ▦ 기능 표면" },
  "## ▦ Package capability archetypes": { zh: "## ▦ 包能力架构类型", ja: "## ▦ パッケージ能力アーキタイプ", ko: "## ▦ 패키지 기능 아키타입" },
  "### ↗ Package metadata links": { zh: "### ↗ 包元数据链接", ja: "### ↗ パッケージメタデータリンク", ko: "### ↗ 패키지 메타데이터 링크" },
  "## ⌘ Interface map": { zh: "## ⌘ 接口地图", ja: "## ⌘ インターフェースマップ", ko: "## ⌘ 인터페이스 맵" },
  "## ↔ PTY market-source filter": { zh: "## ↔ PTY 市场来源过滤", ja: "## ↔ PTY 市場ソースフィルター", ko: "## ↔ PTY 시장 출처 필터" },
  "## ◌ Apps / API scope": { zh: "## ◌ Apps / API 范围", ja: "## ◌ Apps / API スコープ", ko: "## ◌ Apps / API 범위" },
  "Universal, CLI, Git, and Apps use different denominators. Click a metric card for exact SQL and reviewed rows.": {
    zh: "Universal、CLI、Git 与 Apps 使用不同分母。点击指标卡可直接查看准确 SQL 与已审核数据。",
    ja: "Universal、CLI、Git、Apps は異なる分母を使用します。指標カードをクリックすると SQL と確認済みデータを表示します。",
    ko: "Universal, CLI, Git, Apps는 서로 다른 분모를 사용합니다. 지표 카드를 클릭하면 정확한 SQL과 검토된 데이터를 볼 수 있습니다.",
  },
  "rows come from managed curated; bundled and primary runtime are supporting sources.": {
    zh: "行来自受管 curated；bundled 与 primary runtime 是辅助来源。",
    ja: "行は managed curated 由来で、bundled と primary runtime は補助ソースです。",
    ko: "행은 managed curated에서 오며 bundled와 primary runtime은 보조 소스입니다.",
  },
  "sits in Productivity + Business & Operations; 12 categories hold the remainder.": {
    zh: "集中在生产力 + 业务与运营；其余分布在 12 个类别。",
    ja: "生産性 + ビジネス＆運用に集中し、残りは12カテゴリに分布します。",
    ko: "생산성 + 비즈니스 및 운영에 집중되며 나머지는 12개 카테고리에 분포합니다.",
  },
  "Developer Tools over-index in Git; business, finance, and travel over-index in the universal directory.": {
    zh: "Developer Tools 在 Git 中占比更高；业务、金融与旅行在通用目录中占比更高。",
    ja: "Developer Tools は Git で高比率、ビジネス・金融・旅行はユニバーサルで高比率です。",
    ko: "Developer Tools는 Git에서, 비즈니스·금융·여행은 유니버설 디렉터리에서 비중이 높습니다.",
  },
  "Counts overlap.": { zh: "各能力可重叠。", ja: "各能力は重複します。", ko: "기능 수치는 중복될 수 있습니다." },
  "packages reveal skill-heavy, app-heavy, hybrid, and connector-backed shapes.": {
    zh: "个包呈现 Skill-heavy、App-heavy、混合型与 connector-backed 结构。",
    ja: "パッケージは Skill-heavy、App-heavy、ハイブリッド、connector-backed の構造を示します。",
    ko: "개 패키지는 Skill-heavy, App-heavy, 하이브리드, connector-backed 구조를 보여줍니다.",
  },
  "`INDEX SCOPE`": { zh: "`索引范围`", ja: "`索引範囲`", ko: "`인덱스 범위`" },
  "`CATALOG MIX`": { zh: "`目录构成`", ja: "`カタログ構成`", ko: "`카탈로그 구성`" },
  "`METADATA COVERAGE`": { zh: "`元数据覆盖`", ja: "`メタデータカバレッジ`", ko: "`메타데이터 커버리지`" },
  "`CATEGORY × PROVIDER`": { zh: "`类别 × PROVIDER`", ja: "`カテゴリ × プロバイダー`", ko: "`카테고리 × 제공자`" },
  "`TOP 8`": { zh: "`前 8`", ja: "`上位 8`", ko: "`상위 8`" },
  "`PROVIDERS`": { zh: "`PROVIDER`", ja: "`プロバイダー`", ko: "`제공자`" },
  "`CATEGORY POSITIONING`": { zh: "`类别定位`", ja: "`カテゴリ配置`", ko: "`카테고리 포지셔닝`" },
  "`PACKAGE MIX`": { zh: "`包能力构成`", ja: "`パッケージ構成`", ko: "`패키지 구성`" },
  "`ARCHITECTURE MIX`": { zh: "`架构构成`", ja: "`アーキテクチャ構成`", ko: "`아키텍처 구성`" },
  " Skills only ·": { zh: " 仅 Skills ·", ja: " Skills のみ ·", ko: " Skills 전용 ·" },
  "`SURFACES`": { zh: "`接口面`", ja: "`インターフェース面`", ko: "`인터페이스 표면`" },
  "`DIRECTORY FILTER`": { zh: "`目录过滤`", ja: "`ディレクトリフィルター`", ko: "`디렉터리 필터`" },
  "`APP PACKAGES`": { zh: "`APP 包`", ja: "`APP パッケージ`", ko: "`APP 패키지`" },
  "`API SUBSET`": { zh: "`API 子集`", ja: "`API サブセット`", ko: "`API 하위 집합`" },
  "Productivity leads package count; Business & Operations leads distinct-provider breadth.": {
    zh: "生产力类别的插件数最多；业务与运营类别的独立 Provider 广度最大。",
    ja: "生産性はパッケージ数、ビジネス＆運用は一意プロバイダーの広がりで首位です。",
    ko: "생산성은 패키지 수, 비즈니스 및 운영은 고유 제공자 범위에서 가장 큽니다."
  },
  "The largest named providers still represent a small share of 2,857 third-party providers, indicating a highly fragmented catalog.": {
    zh: "最大的一批具名 Provider 在 2,857 个第三方 Provider 中占比仍很小，显示目录高度分散。",
    ja: "最大手の名前付きプロバイダーでも2,857のサードパーティ全体では小さく、カタログは高度に分散しています。",
    ko: "가장 큰 명시적 제공자들도 2,857개 서드파티 제공자 중 작은 비중에 그쳐 카탈로그가 매우 분산되어 있습니다."
  },
  "third-party plugins ·": { zh: "第三方插件 ·", ja: "サードパーティプラグイン ·", ko: "서드파티 플러그인 ·" },
  "providers ·": { zh: "Provider ·", ja: "プロバイダー ·", ko: "제공자 ·" },
  "linked websites.": { zh: "含网站链接。", ja: "Webサイトリンク付き。", ko: "웹사이트 링크 포함." },
  "skills ·": { zh: "Skills ·", ja: "Skills ·", ko: "Skills ·" },
  "App refs ·": { zh: "App 引用 ·", ja: "App 参照 ·", ko: "App 참조 ·" },
  "commands ·": { zh: "命令 ·", ja: "コマンド ·", ko: "명령 ·" },
  "agents.": { zh: "Agents。", ja: "Agents。", ko: "Agents." },
  "notification.": { zh: "条通知。", ja: "通知。", ko: "개 알림." },
  "references ·": { zh: "条引用 ·", ja: "参照 ·", ko: "개 참조 ·" },
  "unique ids ·": { zh: "个唯一 ID ·", ja: "一意 ID ·", ko: "개 고유 ID ·" },
  "third-party references.": { zh: "条第三方引用。", ja: "サードパーティ参照。", ko: "개 서드파티 참조." },
  "Together these account for": { zh: "这些类型合计占", ja: "これらの合計は", ko: "이 유형들은 합계" },
  "% of packages.": { zh: "% 的包。", ja: "% のパッケージを占めます。", ko: "%의 패키지를 차지합니다." },
  "raw App Server rows": { zh: "条 App Server 原始行", ja: "App Server 生行", ko: "개 App Server 원시 행" },
  "CLI-only bundled rows": { zh: "条仅供 CLI 的 bundled 行", ja: "CLI 専用 bundled 行", ko: "개 CLI 전용 bundled 행" },
  "user-visible rows.": { zh: "条用户可见行。", ja: "ユーザー表示行。", ko: "개 사용자 표시 행." },
};

function translateDynamic(value, locale) {
  let match = value.match(/^([\d,]+) TUI-visible entries on ([^;]+); categories are mutually exclusive\.$/u);
  if (match) {
    return {
      zh: `${match[1]} 条 TUI 可见记录，日期 ${match[2]}；类别互斥。`,
      ja: `${match[2]} 時点の TUI 表示 ${match[1]} 件。カテゴリは相互排他的です。`,
      ko: `${match[2]} 기준 TUI 표시 ${match[1]}개이며 카테고리는 상호 배타적입니다.`,
    }[locale];
  }
  match = value.match(/^([\d,]+) plugins across ([\d,]+) named third-party providers\.$/u);
  if (match) {
    return {
      zh: `${match[1]} 个插件，分布于 ${match[2]} 个具名第三方 Provider。`,
      ja: `${match[2]} の名前付きサードパーティプロバイダーにまたがる ${match[1]} プラグイン。`,
      ko: `${match[2]}개 명시적 서드파티 제공자에 걸친 ${match[1]}개 플러그인.`,
    }[locale];
  }
  match = value.match(/^14 labeled categories · x = share of ([\d,]+) TUI rows · y = share of ([\d,]+) Git packages$/u);
  if (match) {
    return {
      zh: `14 个带标签类别 · x = ${match[1]} 条 TUI 记录占比 · y = ${match[2]} 个 Git 包占比`,
      ja: `ラベル付き14カテゴリ · x = TUI ${match[1]} 行の比率 · y = Git ${match[2]} パッケージの比率`,
      ko: `레이블이 있는 14개 카테고리 · x = TUI ${match[1]}행 비중 · y = Git ${match[2]}개 패키지 비중`,
    }[locale];
  }
  match = value.match(/^([\d,]+) catalog rows; the managed curated source is revision ([0-9a-f]+)\.$/u);
  if (match) {
    return {
      zh: `${match[1]} 条目录记录；受管 curated 来源版本为 ${match[2]}。`,
      ja: `${match[1]} カタログ行。managed curated ソースのリビジョンは ${match[2]}。`,
      ko: `${match[1]}개 카탈로그 행이며 managed curated 소스 리비전은 ${match[2]}입니다.`,
    }[locale];
  }
  match = value.match(/^([\d,]+) Git packages · point size = MCP configs · color = manifest provider scope · Git ([0-9a-f]+)$/u);
  if (match) {
    return {
      zh: `${match[1]} 个 Git 包 · 点大小 = MCP 配置 · 颜色 = 清单 Provider 范围 · Git ${match[2]}`,
      ja: `${match[1]} Git パッケージ · 点サイズ = MCP 設定 · 色 = マニフェストのプロバイダー範囲 · Git ${match[2]}`,
      ko: `${match[1]}개 Git 패키지 · 점 크기 = MCP 구성 · 색상 = 매니페스트 제공자 범위 · Git ${match[2]}`,
    }[locale];
  }
  match = value.match(/^([\d,]+) name-level exclusions at Git ([0-9a-f]+)\.$/u);
  if (match) {
    return {
      zh: `Git ${match[2]} 中 ${match[1]} 个名称级排除项。`,
      ja: `Git ${match[2]} における名前単位の除外 ${match[1]} 件。`,
      ko: `Git ${match[2]}의 이름 단위 제외 항목 ${match[1]}개.`,
    }[locale];
  }
  match = value.match(/^([\d,]+) packages · six mutually exclusive Skills \/ Apps \/ MCP archetypes · Git ([0-9a-f]+)$/u);
  if (match) {
    return {
      zh: `${match[1]} 个包 · 六种互斥的 Skills / Apps / MCP 架构类型 · Git ${match[2]}`,
      ja: `${match[1]} パッケージ · 相互排他的な6つの Skills / Apps / MCP アーキタイプ · Git ${match[2]}`,
      ko: `${match[1]}개 패키지 · 상호 배타적인 6개 Skills / Apps / MCP 아키타입 · Git ${match[2]}`,
    }[locale];
  }
  match = value.match(/^([\d,]+) TUI-visible rows vs ([\d,]+) Git packages$/u);
  if (match) {
    return {
      zh: `${match[1]} 条 TUI 可见记录 vs ${match[2]} 个 Git 包`,
      ja: `TUI 表示 ${match[1]} 行 vs Git ${match[2]} パッケージ`,
      ko: `TUI 표시 ${match[1]}행 vs Git ${match[2]}개 패키지`,
    }[locale];
  }
  return null;
}

function translateString(value, locale) {
  if (typeof value !== "string" || /^https?:\/\//u.test(value)) return value;
  let translated = lexicon[value]?.[locale] ?? value;
  if (translated === value) {
    const decorated = value.match(/^([^\p{L}\p{N}]+)(.+)$/u);
    if (decorated && lexicon[decorated[2]]) {
      translated = `${decorated[1]}${lexicon[decorated[2]][locale]}`;
    }
  }
  translated = translateDynamic(translated, locale) ?? translated;
  for (const [english, localized] of Object.entries(phraseLexicon).sort(
    (left, right) => right[0].length - left[0].length,
  )) {
    translated = translated.replaceAll(english, localized[locale]);
  }
  return translated;
}

function translateTree(value, locale, key = null) {
  if (typeof value === "string") {
    if (["id", "field", "dataset", "sourceId", "type", "path", "href", "sql", "url"].includes(key)) {
      return value;
    }
    return translateString(value, locale);
  }
  if (Array.isArray(value)) return value.map((item) => translateTree(item, locale, key));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([childKey, childValue]) => [
        childKey,
        translateTree(childValue, locale, childKey),
      ]),
    );
  }
  return value;
}

await mkdir(outputDir, { recursive: true });
for (const locale of ["zh", "ja", "ko"]) {
  const localized = translateTree(structuredClone(source), locale);
  await writeFile(
    resolve(outputDir, `artifact.${locale}.json`),
    `${JSON.stringify(localized, null, 2)}\n`,
    "utf8",
  );
}

process.stdout.write(
  `${JSON.stringify({ ok: true, input: inputPath, outputDir, locales: ["zh", "ja", "ko"] })}\n`,
);
