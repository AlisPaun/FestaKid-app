import React, { useState, useEffect } from 'react';
import { Plus, Calendar as CalendarIcon, MapPin, Gift as GiftIcon, Users, Sparkles, ChevronLeft, Trash2, Image as ImageIcon, Mail, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { Party, Guest, Gift } from './types';
import { store } from './lib/store';
import { generateInvitation, searchLocation } from './lib/gemini';

const generateId = () => {
  try {
    return crypto.randomUUID();
  } catch (e) {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
};

const getThemeStyles = (theme?: string) => {
  const t = theme?.toLowerCase() || '';
  if (t.includes('spazio') || t.includes('space')) return 'bg-slate-900 text-white border-blue-500/30';
  if (t.includes('principessa') || t.includes('princess') || t.includes('principesse')) return 'bg-pink-50 text-pink-900 border-pink-200';
  if (t.includes('dinosauri') || t.includes('dino')) return 'bg-emerald-50 text-emerald-900 border-emerald-200';
  if (t.includes('supereroi') || t.includes('hero')) return 'bg-red-50 text-red-900 border-red-200';
  if (t.includes('mare') || t.includes('sea')) return 'bg-cyan-50 text-cyan-900 border-cyan-200';
  if (t.includes('safari') || t.includes('animali')) return 'bg-orange-50 text-orange-900 border-orange-200';
  return 'bg-white/90 text-slate-900 border-white/20';
};

const getThemePattern = (theme?: string) => {
  const t = theme?.toLowerCase() || '';
  if (t.includes('spazio') || t.includes('space')) return 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)';
  if (t.includes('principessa') || t.includes('princess') || t.includes('principesse')) return 'radial-gradient(circle at 2px 2px, rgba(236,72,153,0.1) 1px, transparent 0)';
  if (t.includes('dinosauri') || t.includes('dino')) return 'radial-gradient(circle at 2px 2px, rgba(16,185,129,0.1) 1px, transparent 0)';
  if (t.includes('supereroi') || t.includes('hero')) return 'radial-gradient(circle at 2px 2px, rgba(239,68,68,0.1) 1px, transparent 0)';
  if (t.includes('mare') || t.includes('sea')) return 'radial-gradient(circle at 2px 2px, rgba(6,182,212,0.1) 1px, transparent 0)';
  if (t.includes('safari') || t.includes('animali')) return 'radial-gradient(circle at 2px 2px, rgba(249,115,22,0.1) 1px, transparent 0)';
  return 'none';
};

export default function App() {
  const [parties, setParties] = useState<Party[]>([]);
  const [selectedPartyId, setSelectedPartyId] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  
  // Form state
  const [newParty, setNewParty] = useState({
    title: '',
    date: '',
    location: '',
    theme: '',
    description: ''
  });

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const refreshParties = () => {
    setParties(store.getParties());
  };

  useEffect(() => {
    refreshParties();
  }, []);

  const [isSearchingLocation, setIsSearchingLocation] = useState(false);

  const handleSearchLocation = async () => {
    if (!newParty.location) return;
    setIsSearchingLocation(true);
    const result = await searchLocation(newParty.location);
    if (result) {
      setNewParty({ ...newParty, location: result });
    }
    setIsSearchingLocation(false);
  };

  const handleCreateParty = () => {
    const party: Party = {
      id: generateId(),
      title: newParty.title,
      date: newParty.date,
      location: { address: newParty.location },
      theme: newParty.theme,
      description: newParty.description,
      hostId: 'local-user',
      photoUrls: [],
      createdAt: new Date().toISOString()
    };
    store.saveParty(party);
    setParties(store.getParties());
    setIsCreateDialogOpen(false);
    setNewParty({ title: '', date: '', location: '', theme: '', description: '' });
  };

  const handleDeleteParty = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    store.deleteParty(id);
    setParties(store.getParties());
  };

  const selectedParty = parties.find(p => p.id === selectedPartyId);

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-6xl mx-auto">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 sm:mb-12 bg-white/40 backdrop-blur-md p-4 sm:p-6 rounded-3xl border border-white/20 shadow-lg">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            FestaKid <Sparkles className="text-[#FF6B6B]" />
          </h1>
          <p className="text-sm sm:text-base text-slate-700 font-medium">Organizza compleanni magici per i tuoi bambini</p>
        </div>
        
        {!selectedPartyId && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger render={<Button className="btn-primary flex gap-2 w-full sm:w-auto justify-center" />}>
              <Plus size={20} /> Nuovo Compleanno
            </DialogTrigger>
            <DialogContent className={cn("sm:max-w-[425px] transition-colors duration-500 overflow-hidden", getThemeStyles(newParty.theme))}>
              <div 
                className="absolute inset-0 opacity-10 pointer-events-none" 
                style={{ 
                  backgroundImage: getThemePattern(newParty.theme),
                  backgroundSize: '20px 20px'
                }} 
              />
              <DialogHeader className="relative z-10">
                <DialogTitle>Crea un nuovo evento</DialogTitle>
                <DialogDescription className={cn(newParty.theme?.toLowerCase().includes('spazio') ? 'text-blue-200' : 'text-slate-500')}>
                  Inserisci i dettagli del compleanno.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4 relative z-10">
                <div className="grid gap-2">
                  <Label htmlFor="title">Nome del Festeggiato / Titolo</Label>
                  <Input 
                    id="title" 
                    value={newParty.title} 
                    onChange={e => setNewParty({...newParty, title: e.target.value})} 
                    placeholder="Il 5° Compleanno di Luca"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="date">Data e Ora</Label>
                  <Input 
                    id="date" 
                    type="datetime-local" 
                    value={newParty.date} 
                    onChange={e => setNewParty({...newParty, date: e.target.value})} 
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="location">Luogo</Label>
                  <div className="flex gap-2">
                    <Input 
                      id="location" 
                      value={newParty.location} 
                      onChange={e => setNewParty({...newParty, location: e.target.value})} 
                      placeholder="Via Roma 123, Milano"
                      className="flex-1"
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="icon" 
                      onClick={handleSearchLocation}
                      disabled={isSearchingLocation}
                      title="Verifica indirizzo con AI"
                    >
                      <MapPin size={16} className={isSearchingLocation ? 'animate-pulse' : ''} />
                    </Button>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="theme">Tema della Festa</Label>
                  <Select 
                    value={['Dinosauri', 'Spazio', 'Principesse', 'Supereroi', 'Mare', 'Safari'].includes(newParty.theme) ? newParty.theme : (newParty.theme ? 'custom' : '')} 
                    onValueChange={(value) => {
                      if (value === 'custom') {
                        setNewParty({...newParty, theme: ''});
                      } else {
                        setNewParty({...newParty, theme: value});
                      }
                    }}
                  >
                    <SelectTrigger className="w-full h-10">
                      <SelectValue placeholder="Seleziona un tema..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Dinosauri">🦖 Dinosauri</SelectItem>
                      <SelectItem value="Spazio">🚀 Spazio</SelectItem>
                      <SelectItem value="Principesse">👑 Principesse</SelectItem>
                      <SelectItem value="Supereroi">🦸 Supereroi</SelectItem>
                      <SelectItem value="Mare">🌊 Mare</SelectItem>
                      <SelectItem value="Safari">🦁 Safari</SelectItem>
                      <SelectItem value="custom">✨ Altro (Personalizzato)</SelectItem>
                    </SelectContent>
                  </Select>

                  {(!['Dinosauri', 'Spazio', 'Principesse', 'Supereroi', 'Mare', 'Safari'].includes(newParty.theme) || newParty.theme === '') && (
                    <Input 
                      id="theme-custom" 
                      value={newParty.theme} 
                      onChange={e => setNewParty({...newParty, theme: e.target.value})} 
                      placeholder="Inserisci il tuo tema personalizzato..."
                      className="mt-2"
                    />
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="desc">Descrizione</Label>
                  <Textarea 
                    id="desc" 
                    value={newParty.description} 
                    onChange={e => setNewParty({...newParty, description: e.target.value})} 
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreateParty} className="btn-primary w-full">Crea Festa</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            {!selectedPartyId ? (
              <motion.div 
                key="list"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                {parties.length === 0 ? (
                  <div className="col-span-full text-center py-20 bg-white/50 rounded-3xl border-2 border-dashed border-slate-200">
                    <p className="text-slate-400">Non hai ancora creato nessuna festa. Inizia ora!</p>
                  </div>
                ) : (
                  parties.map(party => (
                    <Card 
                      key={party.id} 
                      className={cn("birthday-card cursor-pointer group relative overflow-hidden", getThemeStyles(party.theme))}
                      onClick={() => setSelectedPartyId(party.id)}
                    >
                      <div 
                        className="absolute inset-0 opacity-10 pointer-events-none" 
                        style={{ 
                          backgroundImage: getThemePattern(party.theme),
                          backgroundSize: '20px 20px'
                        }} 
                      />
                      <CardHeader className="pb-2 relative z-10">
                        <div className="flex justify-between items-start">
                          <Badge variant="secondary" className="bg-[var(--color-brand-accent)] text-slate-800">
                            {party.theme || 'Generico'}
                          </Badge>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-slate-400 hover:text-red-500"
                            onClick={(e) => handleDeleteParty(party.id, e)}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                        <CardTitle className="text-xl mt-2">{party.title}</CardTitle>
                        <CardDescription className="flex items-center gap-1">
                          <CalendarIcon size={14} /> {party.date ? format(new Date(party.date), 'dd/MM/yyyy HH:mm') : 'Data non impostata'}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-slate-600 flex items-center gap-1">
                          <MapPin size={14} /> {party.location.address}
                        </p>
                      </CardContent>
                    </Card>
                  ))
                )}
              </motion.div>
            ) : (
              <motion.div 
                key="details"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <Button 
                  variant="ghost" 
                  onClick={() => setSelectedPartyId(null)} 
                  className="mb-6 flex gap-2 items-center text-slate-500 hover:text-slate-900"
                >
                  <ChevronLeft size={20} /> Torna alla lista
                </Button>
                
                {selectedParty && <PartyDetails party={selectedParty} onUpdate={refreshParties} />}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {!selectedPartyId && (
          <div className="space-y-6">
            <Card className="birthday-card p-4">
              <CardTitle className="text-sm font-semibold mb-4">Calendario Eventi</CardTitle>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border shadow-none"
              />
            </Card>
            
            <Card className="birthday-card p-4 bg-[#00674F]">
              <h3 className="font-bold mb-2 text-emerald-300">Prossimi Eventi</h3>
              <div className="space-y-2">
                {parties.slice(0, 3).map(p => (
                  <div key={p.id} className="text-xs bg-white/10 p-2 rounded-lg border border-white/10">
                    <p className="font-medium text-emerald-100">{p.title}</p>
                    <p className="text-emerald-300/80">
                      {p.date && !isNaN(new Date(p.date).getTime()) 
                        ? format(new Date(p.date), 'dd MMM') 
                        : 'Data TBD'}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

function PartyDetails({ party: initialParty, onUpdate }: { party: Party, onUpdate: () => void }) {
  const [party, setParty] = useState(initialParty);
  const [invitation, setInvitation] = useState(party.invitationText || '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [isCopied, setIsCopied] = useState(false);
  
  const [newGuest, setNewGuest] = useState({ name: '', email: '', phone: '' });
  const [newGift, setNewGift] = useState({ name: '', url: '' });
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [invitationImageUrl, setInvitationImageUrl] = useState(party.invitationImageUrl || '');
  const [previewTheme, setPreviewTheme] = useState(party.theme || '');
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setParty(initialParty);
    setGuests(store.getGuests(initialParty.id));
    setGifts(store.getGifts(initialParty.id));
    setImageError(false);
  }, [initialParty]);

  const handleGenerateInvite = async () => {
    setIsGenerating(true);
    const text = await generateInvitation({
      title: party.title,
      theme: party.theme || 'Compleanno',
      date: party.date,
      location: party.location.address,
      description: party.description
    });
    setInvitation(text || '');
    const updatedParty = { ...party, invitationText: text || '' };
    store.saveParty(updatedParty);
    setParty(updatedParty);
    onUpdate();
    setIsGenerating(false);
  };

  const handleAddPhoto = () => {
    if (!newPhotoUrl) return;
    const updatedParty = { ...party, photoUrls: [...party.photoUrls, newPhotoUrl] };
    store.saveParty(updatedParty);
    setParty(updatedParty);
    onUpdate();
    setNewPhotoUrl('');
  };

  const handleSaveInvitation = () => {
    const updatedParty = { 
      ...party, 
      invitationText: invitation, 
      invitationImageUrl: invitationImageUrl,
      theme: previewTheme 
    };
    store.saveParty(updatedParty);
    setParty(updatedParty);
    onUpdate();
  };

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(`Vieni alla mia festa! ${party.title} su FestaKid: ${url}`);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 3000);
  };

  const handleAddGuest = () => {
    if (!newGuest.name) return;
    const guest: Guest = {
      id: generateId(),
      partyId: party.id,
      name: newGuest.name,
      email: newGuest.email,
      phone: newGuest.phone,
      status: 'pending',
      plusOnes: 0
    };
    store.saveGuest(guest);
    setGuests(store.getGuests(party.id));
    setNewGuest({ name: '', email: '', phone: '' });
  };

  const handleAddGift = () => {
    if (!newGift.name) return;
    const gift: Gift = {
      id: generateId(),
      partyId: party.id,
      name: newGift.name,
      url: newGift.url
    };
    store.saveGift(gift);
    setGifts(store.getGifts(party.id));
    setNewGift({ name: '', url: '' });
  };

  const updateGuestStatus = (id: string, status: Guest['status']) => {
    const guest = guests.find(g => g.id === id);
    if (guest) {
      const updated = { ...guest, status };
      store.saveGuest(updated);
      setGuests(store.getGuests(party.id));
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-8">
        <Card className={cn("birthday-card border-none shadow-lg relative overflow-hidden", getThemeStyles(party.theme))}>
          <div 
            className="absolute inset-0 opacity-20 pointer-events-none" 
            style={{ 
              backgroundImage: getThemePattern(party.theme),
              backgroundSize: '24px 24px'
            }} 
          />
          <CardHeader className="relative z-10">
            <div className="flex justify-between items-center">
              <CardTitle className="text-3xl">{party.title}</CardTitle>
              <Badge className="bg-[var(--color-brand-secondary)] text-white">{party.theme}</Badge>
            </div>
            <CardDescription className={cn("text-lg", party.theme?.toLowerCase().includes('spazio') ? 'text-blue-200' : 'text-slate-600')}>
              {party.date && !isNaN(new Date(party.date).getTime()) 
                ? format(new Date(party.date), 'EEEE d MMMM yyyy, HH:mm')
                : 'Data da definire'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 relative z-10">
            <div className="flex items-center gap-2 opacity-80">
              <MapPin className="text-[var(--color-brand-primary)]" />
              <span>{party.location.address}</span>
            </div>
            <p className="leading-relaxed opacity-90">{party.description}</p>
          </CardContent>
        </Card>

        <Tabs defaultValue="invite" className="w-full">
          <TabsList className="grid w-full grid-cols-3 rounded-full p-1 bg-slate-100">
            <TabsTrigger value="invite" className="rounded-full">Invito AI</TabsTrigger>
            <TabsTrigger value="guests" className="rounded-full">Invitati (RSVP)</TabsTrigger>
            <TabsTrigger value="gifts" className="rounded-full">Lista Regali</TabsTrigger>
          </TabsList>
          
          <TabsContent value="invite" className="mt-6">
            <Card className="birthday-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles size={20} className="text-[var(--color-brand-primary)]" />
                  Invito alla Festa
                </CardTitle>
                <CardDescription>Scrivi il tuo invito o usa l'AI per crearne uno magico, poi modificalo come preferisci.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Tema della Festa</Label>
                    <Select 
                      value={['Dinosauri', 'Spazio', 'Principesse', 'Supereroi', 'Mare', 'Safari'].includes(previewTheme) ? previewTheme : (previewTheme ? 'custom' : '')} 
                      onValueChange={(value) => {
                        if (value !== 'custom') setPreviewTheme(value);
                      }}
                    >
                      <SelectTrigger className="w-full bg-slate-50">
                        <SelectValue placeholder="Cambia tema..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Dinosauri">🦖 Dinosauri</SelectItem>
                        <SelectItem value="Spazio">🚀 Spazio</SelectItem>
                        <SelectItem value="Principesse">👑 Principesse</SelectItem>
                        <SelectItem value="Supereroi">🦸 Supereroi</SelectItem>
                        <SelectItem value="Mare">🌊 Mare</SelectItem>
                        <SelectItem value="Safari">🦁 Safari</SelectItem>
                        <SelectItem value="custom">✨ Altro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Immagine (URL)</Label>
                    <div className="flex gap-2">
                      <Input 
                        placeholder="URL immagine..." 
                        value={invitationImageUrl} 
                        onChange={e => {
                          setInvitationImageUrl(e.target.value);
                          setImageError(false);
                        }}
                        className="bg-slate-50 flex-1"
                      />
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
                          const randomId = Math.floor(Math.random() * 1000);
                          setInvitationImageUrl(`https://picsum.photos/seed/${randomId}/800/600`);
                          setImageError(false);
                        }}
                        className="text-xs"
                      >
                        Esempio
                      </Button>
                      {invitationImageUrl && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setInvitationImageUrl('')}
                          className="text-slate-400 hover:text-red-500"
                        >
                          Reset
                        </Button>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400">Usa un link diretto (es. da Imgur o Unsplash)</p>
                  </div>
                </div>

                {previewTheme === 'custom' || !['Dinosauri', 'Spazio', 'Principesse', 'Supereroi', 'Mare', 'Safari'].includes(previewTheme) ? (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Tema Personalizzato</Label>
                    <Input 
                      value={previewTheme === 'custom' ? '' : previewTheme} 
                      onChange={e => setPreviewTheme(e.target.value)} 
                      placeholder="Es: Pirati, Giungla..."
                      className="bg-slate-50"
                    />
                  </div>
                ) : null}

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Testo dell'Invito</Label>
                  <Textarea 
                    placeholder="Scrivi qui il tuo invito personalizzato..." 
                    value={invitation} 
                    onChange={e => setInvitation(e.target.value)}
                    className="min-h-[150px] bg-slate-50 p-4 rounded-xl border border-slate-200 italic text-slate-700 leading-relaxed"
                  />
                </div>
                
                <div className="flex flex-wrap gap-3">
                  <Button 
                    onClick={handleGenerateInvite} 
                    disabled={isGenerating}
                    variant="outline"
                    className="flex-1 min-w-[140px] border-[var(--color-brand-primary)] text-[var(--color-brand-primary)] hover:bg-[var(--color-brand-primary)] hover:text-white"
                  >
                    <Sparkles size={16} className="mr-2" />
                    {isGenerating ? 'Generando...' : 'Genera con AI'}
                  </Button>
                  
                  <Button 
                    onClick={handleSaveInvitation}
                    className="flex-1 min-w-[140px] bg-[var(--color-brand-primary)] text-white"
                  >
                    Salva Modifiche
                  </Button>
                </div>

                <div className="pt-6 border-t border-slate-100">
                  <Label className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4 block">Anteprima Live</Label>
                  <div className={cn("relative p-6 rounded-2xl min-h-[300px] flex flex-col items-center text-center space-y-4 shadow-inner overflow-hidden transition-all duration-500", getThemeStyles(previewTheme))}>
                    <div 
                      className="absolute inset-0 opacity-10 pointer-events-none" 
                      style={{ 
                        backgroundImage: getThemePattern(previewTheme),
                        backgroundSize: '20px 20px'
                      }} 
                    />
                    
                    {invitationImageUrl && !imageError ? (
                      <img 
                        src={invitationImageUrl} 
                        alt="Preview" 
                        className="w-full h-32 object-cover rounded-xl shadow-md relative z-10"
                        referrerPolicy="no-referrer"
                        onError={() => setImageError(true)}
                      />
                    ) : invitationImageUrl && imageError ? (
                      <div className="w-full h-32 bg-red-50 rounded-xl flex flex-col items-center justify-center relative z-10 border border-red-100 text-red-400">
                        <ImageIcon size={24} className="mb-1" />
                        <span className="text-[10px]">Immagine non valida</span>
                      </div>
                    ) : null}
                    
                    <div className="relative z-10 space-y-2 w-full">
                      <h3 className="text-xl font-bold">{party.title}</h3>
                      <div className="whitespace-pre-wrap text-sm italic opacity-90">
                        {invitation || "Inizia a scrivere per vedere l'anteprima..."}
                      </div>
                    </div>

                    <Dialog>
                      <DialogTrigger render={<Button variant="ghost" size="sm" className="relative z-10 mt-2 text-xs underline opacity-70 hover:opacity-100" />}>
                        Espandi Anteprima Completa
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden rounded-3xl border-none shadow-2xl">
                        <div className={cn("relative p-8 min-h-[500px] flex flex-col items-center text-center space-y-6 transition-colors duration-500", getThemeStyles(previewTheme))}>
                          <div 
                            className="absolute inset-0 opacity-20 pointer-events-none" 
                            style={{ 
                              backgroundImage: getThemePattern(previewTheme),
                              backgroundSize: '24px 24px'
                            }} 
                          />
                          
                          {invitationImageUrl && !imageError ? (
                            <img 
                              src={invitationImageUrl} 
                              alt="Invito" 
                              className="w-full h-64 object-cover rounded-2xl shadow-lg relative z-10"
                              referrerPolicy="no-referrer"
                              onError={() => setImageError(true)}
                            />
                          ) : (
                            <div className="w-full h-48 bg-white/20 rounded-2xl flex flex-col items-center justify-center relative z-10 border-2 border-dashed border-white/30 text-white/50">
                              <ImageIcon size={48} className="mb-2 opacity-30" />
                              <p className="text-sm">{imageError ? "Immagine non caricabile" : "Nessuna immagine"}</p>
                            </div>
                          )}
                          
                          <div className="relative z-10 space-y-4 w-full">
                            <h2 className="text-3xl font-bold tracking-tight">{party.title}</h2>
                            <div className="h-1 w-20 bg-[var(--color-brand-primary)] mx-auto rounded-full opacity-50" />
                            <div className="whitespace-pre-wrap text-lg leading-relaxed font-medium italic">
                              {invitation || "Il tuo messaggio di invito apparirà qui..."}
                            </div>
                            
                            <div className="pt-6 space-y-2 text-sm opacity-80 border-t border-white/10">
                              <p className="flex items-center justify-center gap-2">
                                <CalendarIcon size={16} /> {party.date ? format(new Date(party.date), 'EEEE d MMMM, HH:mm') : 'Data da definire'}
                              </p>
                              <p className="flex items-center justify-center gap-2">
                                <MapPin size={16} /> {party.location.address}
                              </p>
                            </div>
                          </div>
                          
                          <Button 
                            className="relative z-10 w-full btn-primary mt-4"
                            onClick={(e) => {
                              const text = `🎉 *INVITO: ${party.title}* 🎉\n\n${invitation}\n\n📅 *Quando:* ${party.date ? format(new Date(party.date), 'dd/MM/yyyy HH:mm') : 'TBD'}\n📍 *Dove:* ${party.location.address}\n\n${invitationImageUrl ? `🖼️ *Immagine:* ${invitationImageUrl}` : ''}`;
                              navigator.clipboard.writeText(text);
                              const btn = e.currentTarget;
                              const originalText = btn.innerText;
                              btn.innerText = "Copiato! ✅";
                              setTimeout(() => {
                                btn.innerText = originalText;
                              }, 2000);
                            }}
                          >
                            Copia Invito per WhatsApp
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="guests" className="mt-6">
            <Card className="birthday-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users size={20} className="text-[var(--color-brand-secondary)]" />
                  Gestione Invitati
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <Input 
                    placeholder="Nome" 
                    value={newGuest.name} 
                    onChange={e => setNewGuest({...newGuest, name: e.target.value})}
                  />
                  <Input 
                    placeholder="Email (opzionale)" 
                    value={newGuest.email} 
                    onChange={e => setNewGuest({...newGuest, email: e.target.value})}
                  />
                  <div className="flex gap-2">
                    <Input 
                      placeholder="Cellulare (opzionale)" 
                      value={newGuest.phone} 
                      onChange={e => setNewGuest({...newGuest, phone: e.target.value})}
                    />
                    <Button onClick={handleAddGuest} className="bg-[var(--color-brand-secondary)] text-white rounded-lg px-3">
                      <Plus size={20} />
                    </Button>
                  </div>
                </div>
                
                <ScrollArea className="h-[300px] w-full rounded-md border p-4">
                  {guests.length === 0 ? (
                    <p className="text-center text-slate-400 py-10">Nessun invitato aggiunto.</p>
                  ) : (
                    <div className="space-y-4">
                      {guests.map(guest => (
                        <div key={guest.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-white rounded-lg border border-slate-100 shadow-sm gap-3">
                          <div className="flex flex-col">
                            <p className="font-medium">{guest.name}</p>
                            <div className="flex gap-2 mt-1">
                              <Badge variant="outline" className={
                                guest.status === 'attending' ? 'border-green-500 text-green-600' :
                                guest.status === 'declined' ? 'border-red-500 text-red-600' :
                                'border-slate-300 text-slate-400'
                              }>
                                {guest.status === 'attending' ? 'Partecipa' : 
                                 guest.status === 'declined' ? 'Non partecipa' : 'In attesa'}
                              </Badge>
                              {guest.phone && <span className="text-[10px] text-slate-400 flex items-center gap-1"><MessageCircle size={10} /> {guest.phone}</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex gap-1 border-r pr-2 mr-1">
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                className="h-8 w-8 text-green-600 hover:bg-green-50"
                                title="Invia su WhatsApp"
                                onClick={() => {
                                  const text = encodeURIComponent(`Ciao ${guest.name}! 🎉 Sei invitato alla festa: ${party.title}\n\n${invitation}\n\n📅 Quando: ${party.date ? format(new Date(party.date), 'dd/MM/yyyy HH:mm') : 'TBD'}\n📍 Dove: ${party.location.address}`);
                                  const url = guest.phone 
                                    ? `https://wa.me/${guest.phone.replace(/\D/g, '')}?text=${text}`
                                    : `https://wa.me/?text=${text}`;
                                  window.open(url, '_blank');
                                }}
                              >
                                <MessageCircle size={16} />
                              </Button>
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                className="h-8 w-8 text-blue-600 hover:bg-blue-50"
                                title="Invia via Email"
                                onClick={() => {
                                  const subject = encodeURIComponent(`Invito: ${party.title}`);
                                  const body = encodeURIComponent(`Ciao ${guest.name}!\n\nSei invitato alla festa: ${party.title}\n\n${invitation}\n\nQuando: ${party.date ? format(new Date(party.date), 'dd/MM/yyyy HH:mm') : 'TBD'}\nDove: ${party.location.address}`);
                                  const url = `mailto:${guest.email || ''}?subject=${subject}&body=${body}`;
                                  window.location.href = url;
                                }}
                              >
                                <Mail size={16} />
                              </Button>
                            </div>
                            <div className="flex gap-1">
                              <Button size="sm" variant="outline" className="h-8 px-2 text-xs" onClick={() => updateGuestStatus(guest.id, 'attending')}>Sì</Button>
                              <Button size="sm" variant="outline" className="h-8 px-2 text-xs" onClick={() => updateGuestStatus(guest.id, 'declined')}>No</Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="gifts" className="mt-6">
            <Card className="birthday-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GiftIcon size={20} className="text-[var(--color-brand-accent)]" />
                  Lista dei Regali
                </CardTitle>
                <CardDescription>Suggerisci agli invitati cosa regalare.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex gap-2">
                  <Input 
                    placeholder="Cosa desidera il festeggiato?" 
                    value={newGift.name} 
                    onChange={e => setNewGift({...newGift, name: e.target.value})}
                  />
                  <Button onClick={handleAddGift} className="bg-[var(--color-brand-accent)] text-slate-800 rounded-lg">Aggiungi</Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {gifts.map(gift => (
                    <div key={gift.id} className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between">
                      <p className="font-semibold text-slate-800">{gift.name}</p>
                      {gift.url && (
                        <a href={gift.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline mt-2">Vedi esempio</a>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <div className="space-y-8">
        <Card className="birthday-card">
          <CardHeader>
            <CardTitle className="text-lg">Mappa del Luogo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="aspect-square bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 relative overflow-hidden">
               {/* Placeholder for Google Maps - in a real app we'd use a library */}
               <div className="absolute inset-0 bg-blue-50 flex flex-col items-center justify-center p-6 text-center">
                  <MapPin size={48} className="text-[var(--color-brand-primary)] mb-4" />
                  <p className="text-sm font-medium text-slate-600">{party.location.address}</p>
                  <p className="text-xs text-slate-400 mt-2 italic">Mappa interattiva verrebbe caricata qui con Google Maps API</p>
               </div>
            </div>
          </CardContent>
        </Card>

        <Card className="birthday-card bg-[var(--color-brand-primary)]">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-lg text-emerald-300">Foto della Festa</CardTitle>
                <CardDescription className="text-emerald-400/80">I momenti più belli.</CardDescription>
              </div>
              <Button variant="ghost" size="icon" onClick={handleShare} title="Condividi Festa" className="text-emerald-300 hover:text-emerald-100 relative">
                <Plus className="rotate-45" />
                {isCopied && (
                  <span className="absolute -top-8 right-0 bg-emerald-600 text-white text-[10px] px-2 py-1 rounded-md animate-bounce">
                    Copiato!
                  </span>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              {party.photoUrls.map((url, i) => (
                <div key={i} className="relative group">
                  <img 
                    src={url} 
                    alt="Party" 
                    className="rounded-lg aspect-square object-cover border border-white/20 w-full" 
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.currentTarget.src = 'https://picsum.photos/seed/error/400/400?blur=2';
                      e.currentTarget.className += ' opacity-50';
                    }}
                  />
                  <Button 
                    variant="destructive" 
                    size="icon" 
                    className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => {
                      const updated = { ...party, photoUrls: party.photoUrls.filter((_, index) => index !== i) };
                      store.saveParty(updated);
                      setParty(updated);
                      onUpdate();
                    }}
                  >
                    <Plus className="rotate-45 h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input 
                placeholder="URL Immagine" 
                value={newPhotoUrl} 
                onChange={e => setNewPhotoUrl(e.target.value)}
                className="bg-white/10 border-white/20 text-emerald-100 placeholder:text-emerald-300/50"
              />
              <Button onClick={handleAddPhoto} variant="secondary" size="sm" className="bg-emerald-500 text-white hover:bg-emerald-600">Aggiungi</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
