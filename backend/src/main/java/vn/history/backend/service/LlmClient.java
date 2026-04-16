package vn.history.backend.service;

public interface LlmClient {

    String chat(String systemPrompt, String userPrompt);
}
