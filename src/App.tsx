import { useMemo, useState, type CSSProperties } from 'react';
import './App.css';

type Operator = '÷' | '×' | '-' | '+';

type ButtonConfig = {
  label: string;
  action: 'digit' | 'operator' | 'decimal' | 'clear' | 'delete' | 'equal';
  value?: string;
  className?: string;
  style?: CSSProperties;
};

const operators: Record<Operator, (a: number, b: number) => number> = {
  '÷': (a, b) => a / b,
  '×': (a, b) => a * b,
  '-': (a, b) => a - b,
  '+': (a, b) => a + b,
};

const initialCurrent = '0';
const MAX_LENGTH = 18; // 限制数字长度，防止显示区域溢出

const sanitizeNumber = (value: string) => {
  if (value === 'Error') return initialCurrent;
  if (value === '') return initialCurrent;
  return value;
};

const trimTrailingZeros = (value: string) => {
  // 压缩小数显示：移除末尾多余的 0 和孤立的小数点
  if (!value.includes('.')) return value;
  const trimmed = value.replace(/\.0+$/, '').replace(/(\.\d*?[1-9])0+$/, '$1').replace(/\.$/, '');
  return trimmed === '' ? initialCurrent : trimmed;
};

const formatResult = (value: number) => {
  const fixed = parseFloat(value.toFixed(10));
  if (!Number.isFinite(fixed)) return 'Error';
  return trimTrailingZeros(fixed.toString());
};

const compute = (a: string, b: string, op: Operator) => {
  const first = parseFloat(a);
  const second = parseFloat(b);
  if (!Number.isFinite(first) || !Number.isFinite(second)) return 'Error';
  if (op === '÷' && second === 0) return 'Error';
  return formatResult(operators[op](first, second));
};

const App = () => {
  const [current, setCurrent] = useState(initialCurrent);
  const [previous, setPrevious] = useState<string | null>(null);
  const [operator, setOperator] = useState<Operator | null>(null);
  const [overwrite, setOverwrite] = useState(false);

  const clearAll = () => {
    setCurrent(initialCurrent);
    setPrevious(null);
    setOperator(null);
    setOverwrite(false);
  };

  const resetIfError = () => {
    if (current === 'Error') {
      clearAll();
    }
  };

  const handleDigit = (digit: string) => {
    resetIfError();
    const next = overwrite || current === initialCurrent ? digit : current + digit;
    if (next.replace('-', '').length > MAX_LENGTH) return;
    if (overwrite) {
      setCurrent(next);
      setOverwrite(false);
      return;
    }
    setCurrent(next === '' ? initialCurrent : next);
  };

  const handleDecimal = () => {
    resetIfError();
    if (current.includes('.')) return;
    if (overwrite) {
      setCurrent('0.');
      setOverwrite(false);
      return;
    }
    if ((current + '.').replace('-', '').length > MAX_LENGTH) return;
    setCurrent(current + '.');
  };

  const handleOperator = (nextOp: Operator) => {
    resetIfError();
    // 若已有待计算的运算符且当前输入有效，则先结算再继续链式运算
    if (operator && previous !== null && !overwrite) {
      const result = compute(previous, current, operator);
      setPrevious(result);
      setCurrent(result);
    } else {
      setPrevious(current);
    }
    setOperator(nextOp);
    setOverwrite(true);
  };

  const handleEqual = () => {
    resetIfError();
    if (!operator || previous === null) return;
    const result = compute(previous, current, operator);
    setCurrent(result);
    setPrevious(null);
    setOperator(null);
    setOverwrite(true);
  };

  const handleDelete = () => {
    resetIfError();
    if (overwrite) {
      setCurrent(initialCurrent);
      setOverwrite(false);
      return;
    }
    if (current.length <= 1) {
      setCurrent(initialCurrent);
      return;
    }
    setCurrent(current.slice(0, -1));
  };

  const handleButtonClick = (button: ButtonConfig) => {
    switch (button.action) {
      case 'digit':
        handleDigit(button.label);
        break;
      case 'decimal':
        handleDecimal();
        break;
      case 'operator':
        handleOperator(button.value as Operator);
        break;
      case 'equal':
        handleEqual();
        break;
      case 'clear':
        clearAll();
        break;
      case 'delete':
        handleDelete();
        break;
      default:
        break;
    }
  };

  const displayValue = useMemo(() => sanitizeNumber(current), [current]);

  const buttons: ButtonConfig[] = [
    { label: 'C', action: 'clear', className: 'control' },
    { label: 'DEL', action: 'delete', className: 'control' },
    { label: '÷', action: 'operator', value: '÷', className: 'operator' },
    { label: '×', action: 'operator', value: '×', className: 'operator' },
    { label: '7', action: 'digit' },
    { label: '8', action: 'digit' },
    { label: '9', action: 'digit' },
    { label: '-', action: 'operator', value: '-', className: 'operator' },
    { label: '4', action: 'digit' },
    { label: '5', action: 'digit' },
    { label: '6', action: 'digit' },
    { label: '+', action: 'operator', value: '+', className: 'operator' },
    { label: '1', action: 'digit' },
    { label: '2', action: 'digit' },
    { label: '3', action: 'digit' },
    {
      label: '=',
      action: 'equal',
      className: 'equals',
      style: { gridRow: '4 / span 2', gridColumn: '4 / span 1' },
    },
    { label: '0', action: 'digit', className: 'zero', style: { gridColumn: '1 / span 2' } },
    { label: '.', action: 'decimal' },
  ];

  return (
    <div className="app">
      <div className="calculator">
        <div className="display">
          <div className="history">
            {previous && operator ? `${previous} ${operator}` : '\u00a0'}
          </div>
          <div className="current">{displayValue}</div>
        </div>
        <div className="keys-grid">
          {buttons.map((button) => (
            // Render each key with optional grid overrides for layout matching the reference
            <button
              key={button.label}
              className={`key ${button.className ?? ''}`.trim()}
              style={button.style}
              onClick={() => handleButtonClick(button)}
            >
              {button.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default App;
