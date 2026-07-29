/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import BookingWizard from './components/BookingWizard';

export default function App() {
  return (
    <div className="h-[100dvh] w-full bg-white flex font-sans selection:bg-[#FFD700]/30 overflow-hidden">
      <BookingWizard />
    </div>
  );
}
