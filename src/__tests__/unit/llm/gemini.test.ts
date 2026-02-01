/**
 * Gemini Provider Tests
 * 
 * Story 4.4: AI Email Assistant
 * Tests for email generation and improvement logic
 */

import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import { LLMError } from '@/lib/llm/types';

// Create a hoisted mock function that can be referenced across tests
const mockGenerateContent = vi.hoisted(() => vi.fn());

// Mock must be defined with inline class to avoid hoisting issues
vi.mock('@google-cloud/vertexai', () => ({
    VertexAI: class {
        constructor(_options: unknown) { }
        getGenerativeModel() {
            return {
                generateContent: mockGenerateContent
            };
        }
    }
}));

// Import after mock setup - creates a new instance
import { geminiProvider } from '@/lib/llm/gemini';

describe('GeminiProvider', () => {
    beforeAll(() => {
        // Ensure credentials are set for all tests
        process.env.GOOGLE_APPLICATION_CREDENTIALS = './credentials/vertex-ai-service-account.json';
    });

    beforeEach(() => {
        // Reset mock before each test
        mockGenerateContent.mockReset();
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
                                text: '```json\n{"subject": "Test", "body": "<p>Body</p>"}\n```'
                            }]
                        }
                    }]
                }
            });

            const result = await geminiProvider.generateEmail('prompt');
            expect(result).toEqual({
                subject: 'Test',
                body: '<p>Body</p>'
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
                                    body: '<p>Improved Body</p>'
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
                            parts: [{
                                text: JSON.stringify({
                                    subject: 'Subject',
                                    body: '<p>Result</p>'
                                })
                            }]
                        }
                    }]
                }
            });

            await geminiProvider.improveEmail('Subject', '<p>Paragraph</p>');

            const callArg = mockGenerateContent.mock.calls[0][0];
            // Input body should be stripped - check the Corps section
            // The call should contain "Paragraph" without the HTML tags around it
            expect(callArg).toContain('Corps:\nParagraph');
        });
    });
});
