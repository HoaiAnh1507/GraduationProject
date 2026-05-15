package vn.history.backend.service.llm;

public interface LlmClient {

    String chat(String systemPrompt, String userPrompt);
}
