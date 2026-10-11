function normalizeConcept(concept) {
  return concept
    .normalize('NFKC')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

function buildConceptReview(attempts) {
  const seenQuestions = new Set()
  const groups = new Map()

  // Attempts must arrive newest first.
  for (const attempt of attempts) {
    const documentId = String(attempt.document)
    const quizId = String(attempt.quiz)

    for (const answer of attempt.answers) {
      const questionKey = `${quizId}:${answer.questionId}`

      // Ignore older submissions of the same question.
      if (seenQuestions.has(questionKey)) continue

      seenQuestions.add(questionKey)

      const conceptKey = normalizeConcept(answer.concept)
      const groupKey = `${documentId}:${conceptKey}`

      if (!groups.has(groupKey)) {
        groups.set(groupKey, {
          id: groupKey,
          documentId,
          concept: answer.concept.trim(),
          reviewedQuestions: 0,
          incorrectQuestions: 0,
          latestMistakeAt: null,
        })
      }

      const group = groups.get(groupKey)
      group.reviewedQuestions += 1

      if (!answer.isCorrect) {
        group.incorrectQuestions += 1

        if (!group.latestMistakeAt) {
          group.latestMistakeAt = attempt.createdAt
        }
      }
    }
  }

  const allGroups = [...groups.values()]

  const concepts = allGroups
    .filter((group) => group.incorrectQuestions > 0)
    .map((group) => ({
      ...group,
      correctQuestions:
        group.reviewedQuestions - group.incorrectQuestions,
      repeatedMistakes: group.incorrectQuestions >= 2,
    }))
    .sort(
      (first, second) =>
        second.incorrectQuestions - first.incorrectQuestions ||
        new Date(second.latestMistakeAt) -
          new Date(first.latestMistakeAt)
    )

  return {
    reviewedQuestions: seenQuestions.size,
    incorrectQuestions: allGroups.reduce(
      (total, group) => total + group.incorrectQuestions,
      0
    ),
    repeatedConcepts: concepts.filter(
      (concept) => concept.repeatedMistakes
    ).length,
    concepts,
  }
}

module.exports = buildConceptReview