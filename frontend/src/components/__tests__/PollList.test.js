import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { LanguageProvider } from '../../context/LanguageContext';
import PollList from '../PollList';
import API from '../../api';

jest.mock('../../api');

describe('PollList Component', () => {
  const mockPolls = [
    {
      _id: '1',
      title: 'Test Poll 1',
      options: [{ option: 'Option 1', votes: 0 }],
      createdBy: { username: 'testUser' }
    }
  ];

  beforeEach(() => {
    API.get.mockResolvedValue({ data: mockPolls });
  });

  test('renders poll list', async () => {
    render(
      <BrowserRouter>
        <LanguageProvider>
          <PollList />
        </LanguageProvider>
      </BrowserRouter>
    );

    expect(await screen.findByText('Test Poll 1')).toBeInTheDocument();
  });

  test('handles API error', async () => {
    API.get.mockRejectedValue({ response: { data: { message: 'Error' } } });

    render(
      <BrowserRouter>
        <LanguageProvider>
          <PollList />
        </LanguageProvider>
      </BrowserRouter>
    );

    expect(await screen.findByText(/error/i)).toBeInTheDocument();
  });
});