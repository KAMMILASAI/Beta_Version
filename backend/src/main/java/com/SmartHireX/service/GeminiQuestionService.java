package com.SmartHireX.service;

import com.SmartHireX.dto.CodingChallenge;
import com.SmartHireX.dto.McqQuestion;
import com.SmartHireX.entity.CandidateProfile;
import com.SmartHireX.entity.User;

import java.util.List;

public interface GeminiQuestionService {
    List<McqQuestion> generateMcqs(User user, CandidateProfile profile, List<String> techs, String difficulty, int count);
    CodingChallenge generateCoding(User user, CandidateProfile profile, String tech, String difficulty);
}
