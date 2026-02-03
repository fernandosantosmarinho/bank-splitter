import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        // URL do Backend para processamento interno (Frontend -> Backend)
        // Prioriza variável específica do motor de extração (ex: Hugging Face), 
        // fallback para a API pública ou localhost.
        const backendUrl = process.env.INTERNAL_ENGINE_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:7860/api/v1";
        const normalizedUrl = backendUrl.replace(/\/$/, "");

        // Constrói a URL alvo. 
        // Se backendUrl for ".../v1", resultado será ".../v1/extract"
        const targetUrl = `${normalizedUrl}/extract`;

        console.log(`[Proxy] Forwarding extraction request to: ${targetUrl}`);

        const contentType = req.headers.get("content-type");

        // Proxy da requisição para o backend python
        const response = await fetch(targetUrl, {
            method: "POST",
            body: req.body,
            headers: {
                // Repassa o Content-Type (essencial para multipart/form-data com boundary)
                ...(contentType && { "Content-Type": contentType }),
            },
            // @ts-ignore - Necessário para streaming body no Node fetch
            duplex: "half"
        });

        if (!response.ok) {
            console.error(`[Proxy] Backend error: ${response.status} ${response.statusText}`);
            const errorText = await response.text();
            console.error(`[Proxy] Error details: ${errorText}`);
            return NextResponse.json(
                { error: `Backend Error (${response.status}): ${response.statusText}` },
                { status: response.status }
            );
        }

        // Retorna o stream de resposta do backend diretamente para o frontend
        return new NextResponse(response.body, {
            status: response.status,
            headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
            },
        });

    } catch (error: any) {
        console.error("[Proxy] Critical error:", error);
        return NextResponse.json({ error: error.message || "Internal Proxy Error" }, { status: 500 });
    }
}
