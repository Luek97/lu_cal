import React, { useState, useRef } from 'react';
import { BucketGoal, EventSize } from '../types';
import { Plus, Camera, Trash2, Check, Trophy, ChevronDown, ChevronUp, X } from 'lucide-react';

interface BucketListViewProps {
  goals: BucketGoal[];
  onAddGoal: (goal: BucketGoal) => void;
  onUpdateGoal: (goal: BucketGoal) => void;
  onDeleteGoal: (id: string) => void;
  onGoalPointerDown: (e: React.PointerEvent, goal: BucketGoal) => void;
}

export const BucketListView: React.FC<BucketListViewProps> = ({ 
  goals, 
  onAddGoal, 
  onUpdateGoal, 
  onDeleteGoal,
  onGoalPointerDown
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  
  const [newTitle, setNewTitle] = useState('');
  const [newTarget, setNewTarget] = useState('');
  const [newReward, setNewReward] = useState('');
  const [newSize, setNewSize] = useState<EventSize>('medium');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeGoalIdForPhoto, setActiveGoalIdForPhoto] = useState<string | null>(null);
  const [activeMilestoneForPhoto, setActiveMilestoneForPhoto] = useState<number | null>(null);

  // Photo Modal State
  const [viewingPhoto, setViewingPhoto] = useState<{ src: string, title: string, milestone: number } | null>(null);

  const MAX_GOALS = 5;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newTarget) return;
    if (goals.length >= MAX_GOALS) return;

    const goal: BucketGoal = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      title: newTitle,
      targetCount: parseInt(newTarget) || 1,
      currentCount: 0,
      reward: newReward,
      lastUpdated: Date.now(),
      size: newSize,
      milestones: {}
    };

    onAddGoal(goal);
    setNewTitle('');
    setNewTarget('');
    setNewReward('');
    setNewSize('medium');
    setIsAdding(false);
  };

  const handleIncrement = (goal: BucketGoal) => {
    if (goal.currentCount < goal.targetCount) {
      onUpdateGoal({
        ...goal,
        currentCount: goal.currentCount + 1,
        lastUpdated: Date.now()
      });
    }
  };

  // Logic to determine current milestone context
  const getCurrentMilestone = (current: number, target: number) => {
    const progress = current / target;
    if (progress >= 1) return 100;
    if (progress >= 0.75) return 75;
    if (progress >= 0.5) return 50;
    if (progress >= 0.25) return 25;
    return 0;
  };

  const handlePhotoClick = (goal: BucketGoal) => {
    const milestone = getCurrentMilestone(goal.currentCount, goal.targetCount);
    
    // If we haven't reached a milestone (25%), do nothing
    if (milestone === 0) return;

    const existingPhoto = goal.milestones?.[milestone];

    if (existingPhoto) {
      // View Photo
      setViewingPhoto({
        src: existingPhoto,
        title: goal.title,
        milestone: milestone
      });
    } else {
      // Upload Photo
      setActiveGoalIdForPhoto(goal.id);
      setActiveMilestoneForPhoto(milestone);
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && activeGoalIdForPhoto && activeMilestoneForPhoto) {
      const base64 = await compressImage(file);
      const goal = goals.find(g => g.id === activeGoalIdForPhoto);
      if (goal) {
        onUpdateGoal({ 
          ...goal, 
          milestones: {
            ...(goal.milestones || {}),
            [activeMilestoneForPhoto]: base64
          }
        });
      }
      setActiveGoalIdForPhoto(null);
      setActiveMilestoneForPhoto(null);
    }
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const scaleSize = MAX_WIDTH / img.width;
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scaleSize;
          
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
          // Compress to jpeg
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const sizeOptions: { value: EventSize; color: string }[] = [
    { value: 'large', color: 'bg-muji-red' },
    { value: 'medium', color: 'bg-muji-orange' },
    { value: 'small', color: 'bg-muji-green' },
  ];

  return (
    <div className="flex flex-col animate-fadeIn relative z-0">
      {/* Hidden File Input */}
      <input 
        type="file" 
        accept="image/*" 
        ref={fileInputRef} 
        className="hidden" 
        onChange={handleFileChange}
      />

      {/* Header */}
      <div className="flex justify-between items-center mb-2">
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center space-x-1 text-xs font-bold text-muji-subtext tracking-widest uppercase hover:text-muji-text transition-colors"
        >
          <span>Goal Tracker</span>
          <span className="text-[10px] font-normal opacity-70 ml-1">({goals.length}/{MAX_GOALS})</span>
          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
        <button 
           onClick={() => { 
             if (goals.length < MAX_GOALS) {
                setIsAdding(!isAdding); 
                setIsExpanded(true); 
             }
           }}
           disabled={goals.length >= MAX_GOALS}
           className={`text-muji-subtext transition-colors ${goals.length >= MAX_GOALS ? 'opacity-30 cursor-not-allowed' : 'hover:text-muji-text'}`}
        >
          <Plus className={`w-4 h-4 transition-transform ${isAdding ? 'rotate-45' : ''}`} />
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleAdd} className="mb-3 p-3 bg-white rounded-xl shadow-sm border border-muji-border space-y-3 animate-slideDown">
          <input
            className="w-full text-sm outline-none border-b border-gray-100 pb-1 bg-transparent"
            placeholder="New Goal Title"
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            autoFocus
          />
          <div className="flex space-x-2">
            <input
              type="number"
              className="w-16 text-sm outline-none border-b border-gray-100 pb-1 bg-transparent"
              placeholder="Target"
              value={newTarget}
              onChange={e => setNewTarget(e.target.value)}
            />
            <input
              className="flex-1 text-sm outline-none border-b border-gray-100 pb-1 bg-transparent"
              placeholder="Reward (Opt)"
              value={newReward}
              onChange={e => setNewReward(e.target.value)}
            />
          </div>
          
          {/* Priority Selection */}
          <div className="flex items-center space-x-2 pt-1">
            <span className="text-xs text-muji-subtext uppercase mr-2">Category:</span>
            {sizeOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setNewSize(opt.value)}
                className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${newSize === opt.value ? 'ring-2 ring-offset-1 ring-gray-300 scale-110' : 'opacity-70 hover:opacity-100'}`}
              >
                <div className={`w-4 h-4 rounded-full ${opt.color}`}></div>
              </button>
            ))}
          </div>

          <button type="submit" className="w-full py-2 bg-muji-text text-white rounded-lg text-xs font-medium mt-2">
            Create
          </button>
        </form>
      )}

      {/* Goal List Rows */}
      {isExpanded && (
        <div className="space-y-2 max-h-[35vh] overflow-y-auto no-scrollbar pb-1">
          {goals.map(goal => {
            const isCompleted = goal.currentCount >= goal.targetCount;
            const progress = Math.min(100, (goal.currentCount / goal.targetCount) * 100);
            const goalSize = goal.size || 'medium';
            const sizeColor = goalSize === 'large' ? 'bg-muji-red' : goalSize === 'medium' ? 'bg-muji-orange' : 'bg-muji-green';
            
            const currentMilestone = getCurrentMilestone(goal.currentCount, goal.targetCount);
            const hasPhotoForMilestone = currentMilestone > 0 && goal.milestones?.[currentMilestone];
            const isPhotoActionEnabled = currentMilestone > 0;

            return (
              <div 
                key={goal.id} 
                onPointerDown={(e) => {
                   // Prevent drag if clicking buttons
                   if ((e.target as HTMLElement).closest('button')) return;
                   onGoalPointerDown(e, goal);
                }}
                className="relative flex items-center justify-between bg-stone-50 rounded-xl shadow-sm border border-transparent overflow-hidden cursor-grab active:cursor-grabbing group touch-none"
              >
                {/* Progress Bar Background */}
                <div 
                  className="absolute top-0 bottom-0 left-0 bg-white/60 transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />

                {/* Category Indicator Strip */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${sizeColor}`}></div>

                <div className="relative z-10 flex items-center justify-between w-full p-3 pl-4">
                    {/* Left: Title */}
                    <div className="flex flex-col min-w-0 pr-2 max-w-[40%]">
                        <h3 className={`font-medium text-sm truncate ${isCompleted ? 'text-muji-green' : 'text-muji-text'}`}>
                            {goal.title}
                        </h3>
                        {goal.reward && (
                            <div className="flex items-center text-[10px] text-muji-orange">
                            <Trophy className="w-2.5 h-2.5 mr-1" />
                            <span className="truncate">{goal.reward}</span>
                            </div>
                        )}
                    </div>

                    {/* Right: Actions & Count */}
                    <div className="flex items-center space-x-2 shrink-0">
                        {/* Count */}
                        <div className="text-xs font-bold text-muji-subtext whitespace-nowrap min-w-[3rem] text-right">
                            <span className={isCompleted ? 'text-muji-green' : 'text-muji-text'}>{goal.currentCount}</span>
                            <span className="mx-0.5 opacity-50">/</span>
                            {goal.targetCount}
                        </div>

                        {/* Photo Action Btn */}
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                handlePhotoClick(goal);
                            }}
                            disabled={!isPhotoActionEnabled}
                            className={`
                                w-8 h-8 rounded-lg flex items-center justify-center border transition-all
                                ${isPhotoActionEnabled 
                                    ? 'bg-white border-muji-border hover:border-muji-text text-muji-text' 
                                    : 'bg-transparent border-transparent text-gray-300 cursor-not-allowed'}
                            `}
                        >
                            {hasPhotoForMilestone ? (
                                <div className="relative w-full h-full overflow-hidden rounded-md group-hover:scale-105 transition-transform">
                                    <img src={goal.milestones?.[currentMilestone]} alt="Milestone" className="w-full h-full object-cover" />
                                </div>
                            ) : (
                                <Camera className="w-4 h-4" />
                            )}
                        </button>

                        {/* Plus Btn */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleIncrement(goal);
                            }}
                            disabled={isCompleted}
                            className={`
                            w-8 h-8 rounded-lg flex items-center justify-center transition-all shadow-sm
                            ${isCompleted 
                                ? 'bg-muji-green text-white cursor-default' 
                                : 'bg-muji-text text-white active:scale-95 hover:opacity-90'}
                            `}
                        >
                            {isCompleted ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                        </button>
                        
                        {/* Delete (Small) */}
                        <button 
                            onClick={(e) => { e.stopPropagation(); onDeleteGoal(goal.id); }}
                            className="text-gray-300 hover:text-muji-red transition-colors p-1"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
              </div>
            );
          })}
          {goals.length === 0 && !isAdding && (
            <div className="text-center py-4 text-xs text-muji-subtext bg-white/50 rounded-xl border border-dashed border-muji-border">
              Add a habit (Max {MAX_GOALS})
            </div>
          )}
        </div>
      )}

      {/* Photo Viewer Modal */}
      {viewingPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 animate-fadeIn" onClick={() => setViewingPhoto(null)}>
            <div className="relative max-w-lg w-full bg-white rounded-2xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="relative aspect-square bg-black">
                    <img src={viewingPhoto.src} alt="Full size" className="w-full h-full object-contain" />
                </div>
                <div className="p-4 flex justify-between items-center bg-white">
                    <div>
                        <h3 className="font-medium text-lg text-muji-text">{viewingPhoto.title}</h3>
                        <span className="text-xs font-bold text-muji-orange px-2 py-1 bg-orange-100 rounded-full">
                            {viewingPhoto.milestone}% Milestone Reached
                        </span>
                    </div>
                    <button 
                        onClick={() => setViewingPhoto(null)}
                        className="p-2 bg-muji-bg rounded-full hover:bg-gray-200 transition-colors"
                    >
                        <X className="w-6 h-6 text-muji-text" />
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};