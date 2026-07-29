import fs from 'fs';
let content = fs.readFileSync('src/components/BookingWizard.tsx', 'utf8');

content = content.replace(/import \{([^\}]+)\} from 'lucide-react';/, (match, p1) => {
  return `import {${p1}, CreditCard, Smartphone, Banknote, Clock as ClockIcon} from 'lucide-react';`;
});

content = content.replace('const [isSending, setIsSending] = useState(false);', `const [isSending, setIsSending] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'tarjeta' | 'bizum' | 'efectivo' | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'selection' | 'processing' | 'done'>('selection');
`);

content = content.replace('const submitReservation = async () => {', `const handlePayment = async () => {
    if (!paymentMethod) return;
    setIsProcessingPayment(true);
    setPaymentStep('processing');
    
    // Simulate payment processing
    setTimeout(() => {
      setPaymentStep('done');
      setIsProcessingPayment(false);
      submitReservation();
    }, 2500);
  };
  
  const submitReservation = async () => {`);

// Change max steps from 5 to 6
content = content.replace('if (step < 5) {', 'if (step < 6) {');
content = content.replace('Paso {step}/4', 'Paso {step}/5');
content = content.replace('Paso {step}/4', 'Paso {step}/5');

// Find the form step (step 3) and split it into two steps (step 3: details, step 4: user data).
// Find the summary step (step 4) and change it to step 5.
// Find the success step (step 5) and change it to step 6.
fs.writeFileSync('src/components/BookingWizard.tsx', content);
