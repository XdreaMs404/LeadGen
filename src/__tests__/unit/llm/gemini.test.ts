/**
 * Gemini Provider Tests
 * 
 * Story 4.4: AI Email Assistant
 * Tests for email generation and improvement logic
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { geminiProvider } from '@/lib/llm/gemini';
import { LLMError } from '@/lib/llm/types';

// Mock the Vertex AI client
const mockGenerateContent = vi.fn();

// Use a class for the mock to ensure 'new VertexAI()' works correctly
const MockVertexAI = class {
    constructor(options: any) { }
    getGenerativeModel() {
        return {
            generateContent: mockGenerateContent
        };
    }
};

vi.mock('@google-cloud/vertexai', () => ({
    VertexAI: MockVertexAI
}));

describe('GeminiProvider', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Reset process.env for credentials check
        process.env.GOOGLE_APPLICATION_CREDENTIALS = './credentials/vertex-ai-service-account.json';
    });

    describe('generateEmail', () => {
        it('should successfully generate an email', async () => {
            // Mock successful response
            mockGenerateContent.mockResolvedValueOnce({
                response: {
                    candidates: [{
                        content: {
                            parts: [{
                                text: JSON.stringify({
                                    subject: 'Test Subject',
                                    body: '<p>Test Body</p>'
                                })
                            }]
                        }
                    }]
                }
            });

            const result = await geminiProvider.generateEmail('Write a test email');

            expect(result).toEqual({
                subject: 'Test Subject',
                body: '<p>Test Body</p>'
            });
            expect(mockGenerateContent).toHaveBeenCalledTimes(1);
        });

        it('should handle markdown code blocks in response', async () => {
            mockGenerateContent.mockResolvedValueOnce({
                response: {
                    candidates: [{
                        content: {
                            parts: [{
                                text: '```json\n{"subject": "Test", "body": "Body"}\n```'
                            }]
                        }
                    }]
                }
            });

            const result = await geminiProvider.generateEmail('prompt');
            expect(result).toEqual({
                subject: 'Test',
                body: 'Body'
            });
        });

        it('should wrap plain text body in paragraphs', async () => {
            mockGenerateContent.mockResolvedValueOnce({
                response: {
                    candidates: [{
                        content: {
                            parts: [{
                                text: JSON.stringify({
                                    subject: 'Subject',
                                    body: 'Paragraph 1\n\nParagraph 2'
                                })
                            }]
                        }
                    }]
                }
            });

            const result = await geminiProvider.generateEmail('prompt');
            expect(result.body).toContain('<p>Paragraph 1</p><p>Paragraph 2</p>');
        });

        it('should throw LLMError when response is invalid JSON', async () => {
            mockGenerateContent.mockResolvedValueOnce({
                response: {
                    candidates: [{
                        content: {
                            parts: [{ text: 'Invalid JSON' }]
                        }
                    }]
                }
            });

            await expect(geminiProvider.generateEmail('prompt'))
                .rejects
                .toThrow(LLMError);
        });
    });

    describe('improveEmail', () => {
        it('should include original content in prompt', async () => {
            mockGenerateContent.mockResolvedValueOnce({
                response: {
                    candidates: [{
                        content: {
                            parts: [{
                                text: JSON.stringify({
                                    subject: 'Improved Subject',
                                    body: 'Improved Body'
                                })
                            }]
                        }
                    }]
                }
            });

            await geminiProvider.improveEmail('Old Subject', 'Old Body');

            const callArg = mockGenerateContent.mock.calls[0][0];
            expect(callArg).toContain('Old Subject');
            expect(callArg).toContain('Old Body');
        });

        it('should strip HTML from input body', async () => {
            mockGenerateContent.mockResolvedValueOnce({
                response: {
                    candidates: [{
                        content: {
                            parts: [{ text: '{}' }]
                        }
                    }]
                }
            }).mockRejectedValue(new Error('Ignore this'));

            try {
                await geminiProvider.improveEmail('Subject', '<p>Paragraph</p>');
            } catch (e) {
                // Ignore parsing error for this test, we check the prompt
            }

            const callArg = mockGenerateContent.mock.calls[0][0];
            expect(callArg).not.toContain('<p>');
            expect(callArg).toContain('Paragraph');
        });
    });
});
