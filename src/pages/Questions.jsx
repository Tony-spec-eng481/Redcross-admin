import React, { useState, useEffect } from 'react';
import './Questions.css';
import api from '../utils/api';

function Questions() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [answerModal, setAnswerModal] = useState(null);
  const [answerText, setAnswerText] = useState('');

  const fetchQuestions = () => {
    setLoading(true);
    api.get('/admin/questions')
      .then(res => {
        if (res.data.success) setQuestions(res.data.data);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  const openAnswer = (q) => {
    setAnswerModal(q);
    setAnswerText(q.answer || '');
  };

  const handleAnswer = async () => {
    if (!answerText) return;
    try {
      await api.patch(`/admin/questions/${answerModal.id}/answer`, { answer: answerText });
      setAnswerModal(null);
      setAnswerText('');
      fetchQuestions();
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to submit answer');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete question?')) {
      try {
        await api.delete(`/admin/questions/${id}`);
        fetchQuestions();
      } catch (e) { console.error(e); }
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Questions & Inquiries</h1>
      </div>

      {loading ? (
        <div className="empty-state">Loading questions...</div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Asked By</th>
                <th>Question</th>
                <th>Status</th>
                <th>Answer</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {questions.map(q => (
                <tr key={q.id}>
                  <td><strong>{q.asked_by || 'Anonymous'}</strong></td>
                  <td>{q.question}</td>
                  <td>
                    <span className={`badge badge-${q.status === 'answered' ? 'approved' : 'pending'}`}>
                      {q.status}
                    </span>
                  </td>
                  <td style={{ maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {q.answer || '—'}
                  </td>
                  <td>
                    <div className="actions-cell">
                      <button className="btn-edit" onClick={() => openAnswer(q)}>
                        {q.status === 'answered' ? 'Edit Answer' : 'Answer'}
                      </button>
                      <button className="btn-danger" onClick={() => handleDelete(q.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {questions.length === 0 && (
                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>No questions found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {answerModal && (
        <div className="modal-overlay" onClick={() => setAnswerModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Answer Question</h2>
            <div className="form-group">
              <label>User's Question</label>
              <div className="question-quote-box">
                {answerModal.question}
              </div>
            </div>
            <div className="form-group">
              <label>Your Official Answer</label>
              <textarea
                value={answerText}
                onChange={e => setAnswerText(e.target.value)}
                placeholder="Type your official response..."
                rows={4}
              />
            </div>
            <div className="form-actions">
              <button className="btn-secondary" onClick={() => setAnswerModal(null)}>Cancel</button>
              <button className="btn-primary" onClick={handleAnswer}>Submit Answer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Questions;
