import OpenAI from 'openai';

// Context của tổ chức truyền vào khi gọi AI
export interface OrganizationContext {
  organizationId: string;
  organizationName: string;
  userName: string;
}

// Kết quả lead scoring
export interface LeadScoreResult {
  score: number;          // 0–100
  label: string;          // Hot / Warm / Cold
  reasoning: string;      // Giải thích ngắn gọn
  suggestions: string[];  // Gợi ý hành động tiếp theo
}

// Kết quả email writer
export interface EmailDraftResult {
  subject: string;
  body: string;
}

// System prompt cho FuviBot CRM assistant
const FUVIBOT_SYSTEM_PROMPT = `Bạn là FuviBot — trợ lý AI thông minh được tích hợp trong hệ thống FuviAI CRM.
Nhiệm vụ của bạn là giúp nhân viên bán hàng:
- Phân tích dữ liệu khách hàng và deals
- Gợi ý chiến lược bán hàng
- Soạn thảo email, tin nhắn cho khách
- Trả lời câu hỏi về quy trình bán hàng

Ngôn ngữ chính: Tiếng Việt. Trả lời ngắn gọn, thực tế, hữu ích.
Không bịa đặt dữ liệu — nếu không biết thì nói rõ.`;

export class OpenAIService {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  // =====================
  // FUVIBOT CHAT
  // =====================

  async chat(
    messages: OpenAI.ChatCompletionMessageParam[],
    ctx: OrganizationContext,
  ): Promise<string> {
    // Inject context tổ chức vào system prompt
    const systemWithContext = `${FUVIBOT_SYSTEM_PROMPT}

Thông tin hiện tại:
- Tổ chức: ${ctx.organizationName}
- Người dùng: ${ctx.userName}`;

    const response = await this.client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemWithContext },
        ...messages,
      ],
      max_tokens: 1000,
      temperature: 0.7,
    });

    return response.choices[0]?.message?.content ?? 'Xin lỗi, tôi không thể trả lời lúc này.';
  }

  // =====================
  // LEAD SCORING
  // =====================

  async scoreContact(contactData: {
    firstName: string;
    lastName?: string | null;
    email?: string | null;
    phone?: string | null;
    company?: string | null;
    position?: string | null;
    website?: string | null;
    status: string;
    dealsCount: number;
    totalDealValue: number;
    activitiesCount: number;
    daysSinceCreated: number;
    tags: string[];
  }): Promise<LeadScoreResult> {
    const prompt = `Phân tích thông tin khách hàng sau và cho điểm tiềm năng (lead score) từ 0–100.

Thông tin khách hàng:
- Tên: ${contactData.firstName} ${contactData.lastName ?? ''}
- Email: ${contactData.email ?? 'Chưa có'}
- Điện thoại: ${contactData.phone ?? 'Chưa có'}
- Công ty: ${contactData.company ?? 'Chưa có'}
- Chức vụ: ${contactData.position ?? 'Chưa có'}
- Website: ${contactData.website ?? 'Chưa có'}
- Trạng thái: ${contactData.status}
- Số deals: ${contactData.dealsCount}
- Tổng giá trị deals: ${contactData.totalDealValue.toLocaleString('vi-VN')} VNĐ
- Số hoạt động: ${contactData.activitiesCount}
- Ngày tạo: ${contactData.daysSinceCreated} ngày trước
- Tags: ${contactData.tags.join(', ') || 'Không có'}

Trả về JSON với format:
{
  "score": <số từ 0-100>,
  "label": "<Hot|Warm|Cold>",
  "reasoning": "<giải thích ngắn 1-2 câu>",
  "suggestions": ["<gợi ý 1>", "<gợi ý 2>", "<gợi ý 3>"]
}

Chỉ trả về JSON, không kèm text khác.`;

    const response = await this.client.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 500,
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const raw = response.choices[0]?.message?.content ?? '{}';
    const parsed = JSON.parse(raw);

    return {
      score: Math.min(100, Math.max(0, Number(parsed.score) || 0)),
      label: parsed.label ?? 'Cold',
      reasoning: parsed.reasoning ?? '',
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
    };
  }

  // =====================
  // EMAIL WRITER
  // =====================

  async writeEmail(params: {
    purpose: string;
    contactName: string;
    contactCompany?: string | null;
    contactPosition?: string | null;
    dealTitle?: string | null;
    additionalContext?: string | null;
    tone: 'formal' | 'friendly' | 'urgent';
  }): Promise<EmailDraftResult> {
    const toneLabel = {
      formal: 'lịch sự, chuyên nghiệp',
      friendly: 'thân thiện, gần gũi',
      urgent: 'khẩn cấp, cần phản hồi sớm',
    }[params.tone];

    const prompt = `Soạn một email ${params.purpose} bằng tiếng Việt với giọng văn ${toneLabel}.

Thông tin:
- Người nhận: ${params.contactName}
- Công ty: ${params.contactCompany ?? 'Chưa có'}
- Chức vụ: ${params.contactPosition ?? 'Chưa có'}
- Deal liên quan: ${params.dealTitle ?? 'Không có'}
- Context thêm: ${params.additionalContext ?? 'Không có'}

Trả về JSON:
{
  "subject": "<tiêu đề email>",
  "body": "<nội dung email đầy đủ, có lời chào và ký tên [Tên của bạn]>"
}

Chỉ trả về JSON, không kèm text khác.`;

    const response = await this.client.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 800,
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });

    const raw = response.choices[0]?.message?.content ?? '{}';
    const parsed = JSON.parse(raw);

    return {
      subject: parsed.subject ?? '(Không có tiêu đề)',
      body: parsed.body ?? '(Không có nội dung)',
    };
  }
}
