function sanitizePdfFileName(filename: string) {
  return (
    filename
      .replace(/[\\/:*?"<>|]+/g, "_")
      .replace(/\s+/g, " ")
      .trim() || "document"
  );
}

function removeRuntimeClasses(root: HTMLElement) {
  root.removeAttribute("class");
  root.querySelectorAll("[class]").forEach((node) => {
    node.removeAttribute("class");
  });
}

function createPdfCaptureTarget(element: HTMLElement) {
  const clone = element.cloneNode(true) as HTMLElement;
  removeRuntimeClasses(clone);

  const width = Math.ceil(
    Math.max(element.scrollWidth, element.getBoundingClientRect().width, 794)
  );

  clone.style.width = `${width}px`;
  clone.style.maxWidth = "none";
  clone.style.boxSizing = "border-box";
  clone.style.background = "#ffffff";
  clone.style.backgroundColor = "#ffffff";
  clone.style.color = "#111111";
  clone.style.border = "0";
  clone.style.borderRadius = "0";
  clone.style.boxShadow = "none";

  clone.querySelectorAll("img").forEach((img) => {
    img.crossOrigin = "anonymous";
  });

  const host = document.createElement("div");
  host.style.position = "fixed";
  host.style.left = "0";
  host.style.top = "0";
  host.style.zIndex = "-1";
  host.style.pointerEvents = "none";
  host.style.width = `${width}px`;
  host.style.background = "#ffffff";
  host.style.color = "#111111";
  host.appendChild(clone);
  document.body.appendChild(host);

  return {
    target: clone,
    cleanup: () => host.remove(),
  };
}

function addCanvasToPdf(
  pdf: InstanceType<typeof import("jspdf").jsPDF>,
  canvas: HTMLCanvasElement
) {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 10;
  const imageWidth = pageWidth - margin * 2;
  const pageContentHeight = pageHeight - margin * 2;
  const pageContentHeightPx = Math.floor((pageContentHeight * canvas.width) / imageWidth);

  let sourceY = 0;
  let pageIndex = 0;

  while (sourceY < canvas.height) {
    const sliceHeight = Math.min(pageContentHeightPx, canvas.height - sourceY);
    const pageCanvas = document.createElement("canvas");
    pageCanvas.width = canvas.width;
    pageCanvas.height = sliceHeight;

    const ctx = pageCanvas.getContext("2d");
    if (!ctx) throw new Error("Unable to create PDF canvas context");

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
    ctx.drawImage(
      canvas,
      0,
      sourceY,
      canvas.width,
      sliceHeight,
      0,
      0,
      canvas.width,
      sliceHeight
    );

    if (pageIndex > 0) pdf.addPage();

    const imageHeight = (sliceHeight * imageWidth) / canvas.width;
    pdf.addImage(
      pageCanvas.toDataURL("image/png"),
      "PNG",
      margin,
      margin,
      imageWidth,
      imageHeight
    );

    sourceY += sliceHeight;
    pageIndex++;
  }
}

export async function downloadElementAsPdf(element: HTMLElement, filename: string) {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);

  await document.fonts?.ready;

  const { target, cleanup } = createPdfCaptureTarget(element);

  try {
    const canvas = await html2canvas(target, {
      backgroundColor: "#ffffff",
      imageTimeout: 30000,
      logging: false,
      scale: Math.min(1.5, window.devicePixelRatio || 1.25),
      scrollX: 0,
      scrollY: 0,
      useCORS: true,
      windowHeight: target.scrollHeight,
      windowWidth: target.scrollWidth,
      width: target.scrollWidth,
      height: target.scrollHeight,
    });

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      compress: true,
    });

    addCanvasToPdf(pdf, canvas);
    pdf.save(`${sanitizePdfFileName(filename)}.pdf`);
  } finally {
    cleanup();
  }
}
