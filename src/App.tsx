/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, KeyboardEvent, useRef, useEffect } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { motion, AnimatePresence } from "motion/react";
import { Utensils, Search, Loader2, ChefHat, BookOpen, Plus, X, ChevronDown, Sparkles } from "lucide-react";

interface Recipe {
  name: string;
  ingredients: string[];
  steps: string[];
}

const COMMON_INGREDIENTS = [
  'আলু', 'বেগুন', 'পটল', 'করলা', 'লাউ', 'মিষ্টি কুমড়া', 'ঝিঙা', 'চিচিঙ্গা', 
  'ফুলকপি', 'বাঁধাকপি', 'টমেটো', 'শিম', 'মসুর ডাল', 'মুগ ডাল', 'ডিম', 
  'মুরগি', 'মাছ', 'চিংড়ি', 'পেঁয়াজ', 'রসুন', 'আদা', 'কাঁচামরিচ', 'ধনেপাতা'
];

const POPULAR_RECIPES = [
  'খিচুড়ি', 'সরিষা ইলিশ', 'ডাল চচ্চড়ি', 'বেগুন ভর্তা', 'মুরগির ঝোল', 
  'আলু ভর্তা', 'মাছ ভুনা', 'সবজি নিরামিষ'
];

export default function App() {
  const [input, setInput] = useState('');
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const addIngredient = (name?: string) => {
    const ingredientToAdd = (name || input).trim();
    if (ingredientToAdd && !ingredients.includes(ingredientToAdd)) {
      setIngredients([...ingredients, ingredientToAdd]);
      setInput('');
      setShowDropdown(false);
    }
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      addIngredient();
    }
  };

  const fetchSpecificRecipe = async (recipeName: string) => {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey === 'undefined') {
      setError('Gemini API Key পাওয়া যায়নি। অনুগ্রহ করে Netlify-এ GEMINI_API_KEY সেট করে পুনরায় ডিপ্লয় করুন।');
      return;
    }

    setLoading(true);
    setError(null);
    setRecipes([]);

    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `"${recipeName}" রেসিপিটির বিস্তারিত তথ্য দিন।`,
        config: {
          systemInstruction: "আপনি একজন বাংলাদেশের রান্নার বিশেষজ্ঞ। ব্যবহারকারীর দেওয়া নির্দিষ্ট রেসিপির নাম অনুযায়ী বিস্তারিত তথ্য দিন। রেসিপিটি অবশ্যই বাংলাদেশি স্টাইলে হতে হবে। প্রতিটি রেসিপি সংক্ষেপে ৪–৬ ধাপের মধ্যে বর্ণনা করুন। আউটপুট অবশ্যই JSON ফরম্যাটে হতে হবে।",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING, description: "রেসিপির নাম" },
                ingredients: { 
                  type: Type.ARRAY, 
                  items: { type: Type.STRING },
                  description: "প্রয়োজনীয় উপকরণ"
                },
                steps: { 
                  type: Type.ARRAY, 
                  items: { type: Type.STRING },
                  description: "রান্নার ধাপ"
                }
              },
              required: ["name", "ingredients", "steps"]
            }
          }
        },
      });

      const result = JSON.parse(response.text || '[]');
      setRecipes(result);
    } catch (err) {
      console.error(err);
      setError('রেসিপি তথ্য পেতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setLoading(false);
    }
  };

  const generateRecipes = async () => {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey || apiKey === 'undefined') {
      setError('Gemini API Key পাওয়া যায়নি। অনুগ্রহ করে Netlify-এ GEMINI_API_KEY সেট করে পুনরায় ডিপ্লয় করুন।');
      return;
    }

    if (ingredients.length === 0) {
      setError('অনুগ্রহ করে অন্তত একটি উপকরণ যোগ করুন।');
      return;
    }

    setLoading(true);
    setError(null);
    setRecipes([]);

    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `আমার কাছে এই উপকরণগুলো আছে: ${ingredients.join(', ')}। এই উপকরণগুলো ব্যবহার করে ৩–৫টি সহজ ও সুস্বাদু বাংলাদেশি রেসিপি সাজেস্ট করুন।`,
        config: {
          systemInstruction: "আপনি একজন বাংলাদেশের রান্নার বিশেষজ্ঞ। ব্যবহারকারীর দেওয়া উপকরণগুলো ব্যবহার করে ৩–৫টি সহজ ও সুস্বাদু রেসিপি সাজেস্ট করুন। রেসিপিগুলো অবশ্যই বাংলাদেশে সহজে পাওয়া যায় এমন উপকরণ দিয়ে তৈরি হতে হবে। অতিরিক্ত বিদেশি উপকরণ ব্যবহার করবেন না। প্রতিটি রেসিপি সংক্ষেপে ৪–৬ ধাপের মধ্যে বর্ণনা করুন। আউটপুট অবশ্যই JSON ফরম্যাটে হতে হবে।",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING, description: "রেসিপির নাম" },
                ingredients: { 
                  type: Type.ARRAY, 
                  items: { type: Type.STRING },
                  description: "প্রয়োজনীয় উপকরণ"
                },
                steps: { 
                  type: Type.ARRAY, 
                  items: { type: Type.STRING },
                  description: "রান্নার ধাপ"
                }
              },
              required: ["name", "ingredients", "steps"]
            }
          }
        },
      });

      const result = JSON.parse(response.text || '[]');
      setRecipes(result);
    } catch (err) {
      console.error(err);
      setError('রেসিপি তৈরি করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen font-sans pb-20">
      {/* Header */}
      <header className="bg-[#5A5A40] text-white py-12 px-6 text-center shadow-lg relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-1/2 translate-y-1/2 blur-3xl" />
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto relative z-10"
        >
          <ChefHat className="w-12 h-12 mx-auto mb-4 opacity-90" />
          <h1 className="font-serif text-5xl md:text-6xl font-bold mb-4 tracking-tight">
            বাংলাদেশি রেসিপি বিশেষজ্ঞ
          </h1>
          <p className="text-lg md:text-xl opacity-80 font-light max-w-2xl mx-auto">
            আপনার কাছে থাকা উপকরণ দিয়ে সুস্বাদু ও ঐতিহ্যবাহী বাংলাদেশি খাবারের রেসিপি খুঁজে নিন।
          </p>
        </motion.div>
      </header>

      <main className="max-w-4xl mx-auto px-6 -mt-8 relative z-20">
        {/* Popular Recipes Bar */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-6 overflow-x-auto no-scrollbar flex gap-3 pb-2"
        >
          <div className="flex items-center gap-2 bg-white/80 backdrop-blur px-4 py-2 rounded-full border border-[#5A5A40]/10 shadow-sm whitespace-nowrap">
            <Sparkles className="w-4 h-4 text-[#5A5A40]" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#5A5A40]/60">জনপ্রিয় রেসিপি:</span>
          </div>
          {POPULAR_RECIPES.map((recipe) => (
            <button
              key={recipe}
              onClick={() => fetchSpecificRecipe(recipe)}
              className="bg-white hover:bg-[#5A5A40] hover:text-white text-[#5A5A40] px-5 py-2 rounded-full border border-[#5A5A40]/10 shadow-sm whitespace-nowrap transition-all text-sm font-medium active:scale-95"
            >
              {recipe}
            </button>
          ))}
        </motion.div>

        {/* Input Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[32px] p-8 shadow-xl border border-[#5A5A40]/10"
        >
          <div className="flex flex-col gap-6">
            <div className="relative" ref={dropdownRef}>
              <label className="block text-xs uppercase tracking-widest font-semibold text-[#5A5A40] mb-3 ml-1">
                উপকরণের নাম লিখুন বা সিলেক্ট করুন
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    onFocus={() => setShowDropdown(true)}
                    placeholder="যেমন: আলু, ডাল, বেগুন..."
                    className="w-full px-6 py-4 rounded-2xl bg-[#f5f5f0] border-none focus:ring-2 focus:ring-[#5A5A40] transition-all outline-none text-lg"
                  />
                  <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-[#5A5A40]/40 w-5 h-5" />
                </div>
                <div className="relative">
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="bg-[#5A5A40] text-white p-4 rounded-2xl hover:bg-[#4a4a34] transition-colors shadow-md active:scale-95 flex items-center gap-1"
                  >
                    <Plus className="w-6 h-6" />
                    <ChevronDown className={`w-4 h-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {/* Dropdown Menu */}
                  <AnimatePresence>
                    {showDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-2 w-64 max-h-80 overflow-y-auto bg-white rounded-2xl shadow-2xl border border-[#5A5A40]/10 z-50 p-2 no-scrollbar"
                      >
                        <div className="grid grid-cols-1 gap-1">
                          {COMMON_INGREDIENTS.filter(i => i.includes(input)).map((item) => (
                            <button
                              key={item}
                              onClick={() => addIngredient(item)}
                              className="text-left px-4 py-3 hover:bg-[#f5f5f0] rounded-xl transition-colors text-[#5A5A40] font-medium flex items-center justify-between group"
                            >
                              {item}
                              <Plus className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                          ))}
                          {COMMON_INGREDIENTS.filter(i => i.includes(input)).length === 0 && (
                            <div className="px-4 py-3 text-sm text-[#5A5A40]/40 italic">
                              কোনো মিল পাওয়া যায়নি
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 min-h-[40px]">
              <AnimatePresence>
                {ingredients.map((item, index) => (
                  <motion.span
                    key={index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex items-center gap-2 bg-[#f5f5f0] text-[#5A5A40] px-4 py-2 rounded-full border border-[#5A5A40]/10 text-sm font-medium"
                  >
                    {item}
                    <button onClick={() => removeIngredient(index)} className="hover:text-red-500 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </motion.span>
                ))}
              </AnimatePresence>
            </div>

            <button
              onClick={generateRecipes}
              disabled={loading || ingredients.length === 0}
              className="w-full py-5 bg-[#5A5A40] text-white rounded-2xl font-bold text-xl shadow-lg hover:bg-[#4a4a34] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3"
            >
              {loading ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  রেসিপি তৈরি হচ্ছে...
                </>
              ) : (
                <>
                  <Utensils className="w-6 h-6" />
                  রেসিপি দেখুন
                </>
              )}
            </button>
          </div>
        </motion.div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6 p-4 bg-red-50 text-red-600 rounded-2xl text-center border border-red-100"
          >
            {error}
          </motion.div>
        )}

        {/* Recipes Display */}
        <div className="mt-12 space-y-8">
          <AnimatePresence>
            {recipes.map((recipe, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-[32px] overflow-hidden shadow-lg border border-[#5A5A40]/5"
              >
                <div className="bg-[#f5f5f0] p-8 border-b border-[#5A5A40]/10">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs uppercase tracking-[0.2em] font-bold text-[#5A5A40]/60 mb-2 block">
                        রেসিপি {index + 1}
                      </span>
                      <h2 className="font-serif text-3xl md:text-4xl font-bold text-[#2d2a26]">
                        {recipe.name}
                      </h2>
                    </div>
                    <div className="bg-white p-3 rounded-2xl shadow-sm">
                      <BookOpen className="w-6 h-6 text-[#5A5A40]" />
                    </div>
                  </div>
                </div>

                <div className="p-8 grid md:grid-cols-2 gap-8">
                  {/* Ingredients */}
                  <div>
                    <h3 className="text-sm uppercase tracking-widest font-bold text-[#5A5A40] mb-4 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#5A5A40]" />
                      উপকরণ
                    </h3>
                    <ul className="space-y-2">
                      {recipe.ingredients.map((ing, i) => (
                        <li key={i} className="flex items-center gap-3 text-[#5A5A40]/80">
                          <div className="w-1 h-1 rounded-full bg-[#5A5A40]/30" />
                          {ing}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Steps */}
                  <div>
                    <h3 className="text-sm uppercase tracking-widest font-bold text-[#5A5A40] mb-4 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#5A5A40]" />
                      প্রস্তুত প্রণালী
                    </h3>
                    <div className="space-y-4">
                      {recipe.steps.map((step, i) => (
                        <div key={i} className="flex gap-4">
                          <span className="font-serif italic text-2xl text-[#5A5A40]/20 leading-none">
                            {i + 1}
                          </span>
                          <p className="text-[#5A5A40]/80 leading-relaxed">
                            {step}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Empty State */}
        {!loading && recipes.length === 0 && !error && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-20 text-center opacity-40"
          >
            <ChefHat className="w-16 h-16 mx-auto mb-4" />
            <p className="font-serif italic text-xl">আপনার উপকরণের তালিকা দিয়ে শুরু করুন বা কোনো রেসিপি সিলেক্ট করুন...</p>
          </motion.div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-20 py-12 border-t border-[#5A5A40]/10 text-center">
        <p className="text-sm text-[#5A5A40]/60 uppercase tracking-widest font-medium">
          ঐতিহ্যবাহী বাংলাদেশি স্বাদ • ২০২৬
        </p>
      </footer>
    </div>
  );
}
