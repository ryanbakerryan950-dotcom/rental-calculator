#!/usr/bin/env python3
"""Generate SEO audit report PDF for AlquilerCalc."""

from pathlib import Path

from fpdf import FPDF

OUTPUT = Path(__file__).parent / "SEO-Audit-Report-AlquilerCalc.pdf"

PASSING = [
    ("A3", "Unique title tags", "index.html, calculadora-icl.html, calculadora-ipc/index.html, contrato-de-alquiler.html, sobre-nosotros.html"),
    ("A5", "Unique meta descriptions", "No duplicates among indexable pages"),
    ("B1", "One H1 per page with primary keyword", "Single H1 on every HTML page with target terms"),
    ("B2", "H1 topically aligned with title", "H1 and title differ in wording but share topic on main pages"),
    ("B3", "H2 tags cover main subtopics", "Rich H2 structure on index, IPC, ICL, contrato pages"),
    ("B5", "Primary keyword in at least one H2", "Present on tool/pillar pages"),
    ("C2", "URLs lowercase with hyphens", "calculadora-ipc/, contrato-de-alquiler.html, calculadora-icl.html"),
    ("C5", "No parameter-based indexable URLs", "Static paths only for indexable content"),
    ("D1", "Primary keyword in first ~100 words", "Hero/lead copy on indexable pages"),
    ("D3", "LSI/semantic keywords woven in", "BCRA, INDEC, ICL, IPC, DNU 70/2023, Ley 27.551 across pages"),
    ("D4", "Content matches search intent", "Calculators serve calculation intent; contrato serves legal/guide intent"),
    ("D6", "Content appears original", "Substantive, page-specific Spanish copy"),
    ("D7", "FAQ with natural question phrasing", "index.html, calculadora-ipc/, calculadora-icl.html, contrato-de-alquiler.html"),
    ("E3", "Descriptive ALT on images", "Content images and logos have context-specific alt"),
    ("E4", "ALT reads naturally", "Sentence-style alts, not stuffed"),
    ("E5", "Descriptive image filenames", "about-calculator.webp, faq-icl-illustration.webp, author-martin-fernandez.webp"),
    ("E6", "Lazy loading on below-fold images", "loading=lazy on below-fold picture elements; eager on heroes"),
    ("E7", "OG image set at 1200x630", "og:image meta on all main pages pointing to images/hero-preview.webp"),
    ("E8", "No images replacing HTML text", "Illustrations supplement text; headings/body remain HTML"),
    ("F1", "No orphan indexable pages", "All indexable pages linked from nav/footer/content"),
    ("F2", "Primary calculator linked from homepage", "index.html hero #calculadora, nav, footer"),
    ("F4", "Descriptive internal anchor text", "Calculadora IPC, Calculadora ICL, etc.; no click here"),
    ("F5", "No exact-match anchor overuse", "Varied anchors across pages"),
    ("F6", "Topic cluster interlinking", "Cross-links among index, IPC, ICL, contrato pages"),
    ("F9", "Total links per page under 150", "37-43 href per indexable page"),
    ("F10", "Related tool pages at bottom", "Footer Herramientas block on tool pages"),
    ("G1", "FAQ schema on FAQ pages", "FAQPage JSON-LD on index, IPC, ICL, contrato"),
    ("G3", "WebApplication schema on tool pages", "calculadora-ipc/index.html, calculadora-icl.html"),
    ("G5", "Article schema on supporting content", "contrato-de-alquiler.html, sobre-nosotros.html"),
    ("G6", "Video schema", "No video embeds; requirement N/A"),
    ("G7", "No duplicate/conflicting schema", "Distinct schema types per block"),
    ("H1", "Self-referencing canonical on every page", "link rel=canonical on all 14 HTML files"),
    ("H2", "Paginated pages canonical/next/prev", "No pagination; N/A"),
    ("H3", "Alternate versions canonicalize to main", "No AMP/print/mobile alternates; N/A"),
    ("H4", "No duplicate meta titles/descriptions (indexable)", "Unique among five indexable pages"),
    ("I2", "About Us page exists", "sobre-nosotros.html"),
    ("I3", "Privacy Policy and Terms linked in footer", "politica-privacidad.html, terminos-condiciones.html in footer"),
    ("I5", "Freshness signals present", "Actualizado 2025 badges; policy vigencia June 2025; recent IPC data"),
    ("J2", "Calculator above the fold", "Calculator form in hero on index, IPC, ICL pages"),
    ("J3", "Clear, contrasting CTAs", "Calcular actualizacion, Calcular con IPC, btn--hero-primary"),
    ("J4", "3 clicks or fewer from homepage", "All pages reachable via nav or footer from index.html"),
    ("J5", "Bullet/numbered lists for scannability", "Used extensively on long pages"),
    ("K1", "Concise direct answer at top", "Hero leads/subtitles on tool pages"),
    ("K2", "Dedicated What is section", "IPC, ICL, and index about sections"),
    ("K3", "FAQ uses natural question phrasing", "Who/what/how style in FAQ accordions"),
    ("K4", "HowTo / step-by-step sections", "Step guides on index, IPC, ICL"),
    ("K6", "H2 sections largely self-contained", "FAQ and guide sections as standalone Q&A blocks"),
    ("K7", "Tables where comparison applies", "ICL vs IPC comparison table on index.html"),
    ("K10", "Citation-friendly language", "Segun..., De acuerdo... on multiple pages"),
]

FAILING = [
    ("A1", "Title contains primary keyword at start", "calculadora-icl.html starts with los...; index.html leads with Calcula; sobre-nosotros.html leads with brand not topic"),
    ("A2", "Title length 50-60 characters", "Out of range on ICL (48), contrato (41), sobre (29), politica (37), terminos (44), autor (39)"),
    ("A4", "Meta description 140-160 characters", "Too short on ICL (135), IPC (127), sobre (111), politica (112), terminos (84), autor (103)"),
    ("A6", "Meta description natural keyword variation", "contrato-de-alquiler.html description is Italian, wrong language for Spanish SERP"),
    ("B4", "H3-H6 for nested detail only", "Footer uses decorative h4 Herramientas/Legal sitewide"),
    ("B6", "Logical heading hierarchy", "Footer jumps from content h2 to footer h4, skipping h3"),
    ("C1", "URL contains primary keyword", "Homepage is / or index.html; sobre-nosotros.html is brand-focused"),
    ("C3", "URL max 3-4 words", "contrato-de-alquiler.html, politica-privacidad.html exceed brevity guidance"),
    ("C4", "Consistent URL structure within category", "calculadora-ipc/ uses folder; calculadora-icl.html uses .html file"),
    ("D2", "Keyword density 1-2%", "Not measurable/controlled in source"),
    ("D5", "Word count meets/exceeds SERP average", "Cannot verify from codebase; sobre-nosotros.html may be thin"),
    ("D8", "Answer-first structure per H2", "Many H2 sections do not lead with a direct answer sentence"),
    ("D9", "Content date-stamped when refreshed", "No visible last updated on main tool pages"),
    ("D10", "Bold/italic for answer phrases", "kw-highlight spans used decoratively on keywords, not answer highlighting"),
    ("E1", "All images in WEBP format", "PNG fallbacks still served; PNG masters in assets/ and images/originals/"),
    ("E2", "Images compressed", "about-calculator.png ~410KB; author-martin-fernandez.png ~1.85MB; several PNGs >100KB"),
    ("F3", "Internal links in first 3-4 paragraphs", "Hero body uses # anchors only; cross-page links appear later"),
    ("F7", "No broken internal links", "Social/footer links use href=# placeholders"),
    ("F8", "No redirect chains in internal links", "Links to indices-icl-ipc-cer.html which redirects to calculadora-icl.html"),
    ("G2", "Breadcrumb schema sitewide", "BreadcrumbList missing on index.html; not on all pages"),
    ("G4", "Organization schema on homepage", "index.html has WebSite schema only, not Organization with logo/social"),
    ("G8", "Schema validated (Rich Results Test)", "Cannot be confirmed from static source review"),
    ("H5", "Thin pages expanded or noindexed", "autor.html ~296 words; sobre-nosotros.html ~402 words borderline"),
    ("I1", "Author attribution on content pages", "Only meta author AlquilerCalc; no visible byline on content pages"),
    ("I4", "External citations to authoritative sources", "BCRA/INDEC mentioned but no outbound links to official .gob.ar sources"),
    ("I6", "Contact page live", "No contacto.html; email only in noindex politica-privacidad.html"),
    ("J1", "Table of contents for pages >1500 words", "No TOC on index (~2336w), contrato (~2415w), ICL (~1453w)"),
    ("J6", "No layout shift when results load", "Results injected into empty #calculator-results via JS; CLS unverified"),
    ("J7", "Multimedia where it adds value", "Illustrations only; no video/audio on pillar/tool pages"),
    ("J8", "Social sharing buttons on blog/pillar pages", "Footer social icons use href=#, not share URLs"),
    ("K5", "Speakable schema", "Not implemented on any page"),
    ("K8", "Key Takeaways / summary box near top", "No dedicated takeaways component sitewide"),
    ("K9", "Tool output explanatory sentence in static HTML", "#calculator-results empty in HTML; output via JS only"),
    ("K11", "Site on Wikipedia/Wikidata/directories", "Not verifiable from codebase"),
    ("K12", "Brand + site name consistently paired", "AlquilerCalc vs Calculadora de Alquileres; split domains .com.ar vs .dealquileres.ar"),
    ("K13", "Key facts avoid hedging language", "podria, podrian present in contrato-de-alquiler.html, politica-privacidad.html"),
    ("K14", "Tested in ChatGPT/Gemini/Perplexity", "Not verifiable from codebase"),
    ("K15", "Tool results indexable with crawlable static text", "Crawlers see empty calculator-results containers"),
]


class AuditPDF(FPDF):
    def footer(self):
        self.set_y(-15)
        self.set_font("Helvetica", "I", 8)
        self.set_text_color(120, 120, 120)
        self.cell(0, 10, f"Page {self.page_no()}/{{nb}}", align="C")


def wrap_text(pdf: FPDF, text: str, indent: int = 0) -> None:
    pdf.set_x(pdf.l_margin + indent)
    pdf.multi_cell(0, 5, text)


def section_title(pdf: FPDF, title: str, color: tuple[int, int, int]) -> None:
    pdf.ln(4)
    pdf.set_font("Helvetica", "B", 13)
    pdf.set_text_color(*color)
    pdf.cell(0, 8, title, new_x="LMARGIN", new_y="NEXT")
    pdf.set_text_color(30, 30, 30)
    pdf.ln(1)


def add_items(pdf: FPDF, items: list[tuple[str, str, str]], bullet: str) -> None:
    pdf.set_font("Helvetica", "", 9)
    for item_id, name, detail in items:
        if pdf.get_y() > 265:
            pdf.add_page()
        pdf.set_font("Helvetica", "B", 9)
        pdf.set_x(pdf.l_margin)
        pdf.multi_cell(0, 5, f"{bullet} [{item_id}] {name}")
        pdf.set_font("Helvetica", "", 8.5)
        pdf.set_text_color(60, 60, 60)
        wrap_text(pdf, detail, indent=4)
        pdf.set_text_color(30, 30, 30)
        pdf.ln(2)


def build_pdf() -> None:
    pdf = AuditPDF()
    pdf.alias_nb_pages()
    pdf.set_auto_page_break(auto=True, margin=18)
    # Latin-1 core font supports Spanish accents (á, é, í, ó, ú, ñ, etc.)
    pdf.add_page()

    # Cover
    pdf.set_font("Helvetica", "B", 22)
    pdf.set_text_color(35, 35, 35)
    pdf.ln(20)
    pdf.cell(0, 12, "SEO Audit Report", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "", 14)
    pdf.set_text_color(80, 80, 80)
    pdf.cell(0, 10, "Calculadora de Alquileres / AlquilerCalc", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(4)
    pdf.set_font("Helvetica", "", 10)
    pdf.cell(0, 7, "Read-only codebase audit", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.cell(0, 7, "Date: June 17, 2026", align="C", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(12)

    pdf.set_font("Helvetica", "", 10)
    pdf.set_text_color(40, 40, 40)
    intro = (
        "Scope: 14 HTML pages and partials/footer-social.html. "
        "Indexable pages: index.html, calculadora-icl.html, calculadora-ipc/index.html, "
        "contrato-de-alquiler.html, sobre-nosotros.html. "
        "Seven pages are noindex (legal, author, redirect stubs)."
    )
    pdf.multi_cell(0, 5, intro)
    pdf.ln(6)

    # Summary stats
    pdf.set_font("Helvetica", "B", 11)
    pdf.cell(0, 7, f"Summary: {len(PASSING)} passing  |  {len(FAILING)} failing", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(4)

    section_title(pdf, "PASSING (already implemented)", (22, 120, 60))
    add_items(pdf, PASSING, "[PASS]")

    pdf.add_page()
    section_title(pdf, "FAILING (missing or broken)", (200, 60, 40))
    add_items(pdf, FAILING, "[FAIL]")

    pdf.add_page()
    section_title(pdf, "Scope Notes", (35, 35, 35))
    pdf.set_font("Helvetica", "", 9)
    notes = [
        "Redirect stubs (ley-de-alquileres.html, actualizacion-alquileres.html, calculadora-contratos.html, indices-icl-ipc-cer.html) are correctly noindex but contribute to redirect-chain and duplicate-title issues.",
        "Domain inconsistency: calculadoraalquileres.com.ar (canonical/OG on most pages) vs calculadoradealquileres.ar (IPC canonical, schema, OG image URLs).",
        "Items G8, K11, K14 cannot be fully verified from static source review alone.",
        "No code or content was modified to produce this report.",
    ]
    for note in notes:
        pdf.multi_cell(0, 5, f"- {note}")
        pdf.ln(2)

    pdf.output(str(OUTPUT))
    print(f"Created: {OUTPUT}")


if __name__ == "__main__":
    build_pdf()
