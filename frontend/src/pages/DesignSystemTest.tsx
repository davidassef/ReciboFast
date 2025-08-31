import React, { useState } from 'react';
import { Button, Input, Card, CardHeader, CardBody, CardFooter, Badge } from '../components/ui';

const DesignSystemTest: React.FC = () => {
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);

  const handleTestClick = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  };

  return (
    <div className="min-h-screen bg-neutral-50 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-4xl font-bold text-neutral-900 mb-8">Design System Test</h1>
        
        {/* Button Tests */}
        <Card>
          <CardHeader>
            <h2 className="text-2xl font-semibold text-neutral-800">Buttons</h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-lg font-medium text-neutral-700">Variants</h3>
              <div className="flex flex-wrap gap-2">
                <Button variant="primary">Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="success">Success</Button>
                <Button variant="warning">Warning</Button>
                <Button variant="error">Error</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-medium text-neutral-700">Sizes</h3>
              <div className="flex flex-wrap gap-2 items-center">
                <Button size="sm">Small</Button>
                <Button size="md">Medium</Button>
                <Button size="lg">Large</Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-medium text-neutral-700">States</h3>
              <div className="flex flex-wrap gap-2">
                <Button disabled>Disabled</Button>
                <Button loading={loading} onClick={handleTestClick}>
                  {loading ? 'Loading...' : 'Test Loading'}
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Input Tests */}
        <Card>
          <CardHeader>
            <h2 className="text-2xl font-semibold text-neutral-800">Inputs</h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <Input
              label="Nome"
              placeholder="Digite seu nome"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              helperText="Este é um texto de ajuda"
            />
            
            <Input
              label="Email com erro"
              placeholder="email@exemplo.com"
              error="Este campo é obrigatório"
            />
            
            <Input
              label="Campo desabilitado"
              placeholder="Campo desabilitado"
              disabled
            />
          </CardBody>
        </Card>

        {/* Badge Tests */}
        <Card>
          <CardHeader>
            <h2 className="text-2xl font-semibold text-neutral-800">Badges</h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-lg font-medium text-neutral-700">Variants</h3>
              <div className="flex flex-wrap gap-2">
                <Badge variant="primary">Primary</Badge>
                <Badge variant="secondary">Secondary</Badge>
                <Badge variant="success">Success</Badge>
                <Badge variant="warning">Warning</Badge>
                <Badge variant="error">Error</Badge>
                <Badge variant="neutral">Neutral</Badge>
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-medium text-neutral-700">Sizes</h3>
              <div className="flex flex-wrap gap-2 items-center">
                <Badge size="sm">Small</Badge>
                <Badge size="md">Medium</Badge>
                <Badge size="lg">Large</Badge>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Card Tests */}
        <Card>
          <CardHeader>
            <h2 className="text-2xl font-semibold text-neutral-800">Cards</h2>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">Card Simples</h3>
                </CardHeader>
                <CardBody>
                  <p className="text-neutral-600">Este é um exemplo de card simples com header e body.</p>
                </CardBody>
              </Card>
              
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">Card Completo</h3>
                  <Badge variant="success" size="sm">Ativo</Badge>
                </CardHeader>
                <CardBody>
                  <p className="text-neutral-600">Este card possui header, body e footer.</p>
                </CardBody>
                <CardFooter>
                  <Button size="sm" variant="outline">Cancelar</Button>
                  <Button size="sm">Confirmar</Button>
                </CardFooter>
              </Card>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

export default DesignSystemTest;