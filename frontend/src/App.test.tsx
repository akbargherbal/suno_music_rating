/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('renders the Diwan manuscript header and default sections correctly', () => {
    render(<App />);

    // Brand title is in the document matching the Diwan re-theme
    expect(screen.getByText('ديوان تقييم النابغة')).toBeInTheDocument();

    // Default metadata brand tags are present
    expect(screen.getByText('NABIGHA_01')).toBeInTheDocument();

    // The default active tab "الأقسام والمقاطع" is selected
    expect(screen.getByText('الأقسام والمقاطع')).toBeInTheDocument();

    // The sidebar index header is present
    expect(screen.getByText('فهرس الأقسام الستة')).toBeInTheDocument();
  });
});