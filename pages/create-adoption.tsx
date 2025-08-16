import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

interface AdoptionForm {
  petType: string;
  petBreed?: string;
  petAge?: string;
  petGender?: string;
  petColor?: string;
  petCategory?: string; // Corresponds to size
  description: string;
  images: string[];
  adoptionType: 'permanent' | 'trial' | 'senior' | 'special-needs';
  adoptionFee?: number;
  isSpayedNeutered: boolean;
  isVaccinated: boolean;
  isMicrochipped: boolean;
  specialNeeds?: string;
  medicalHistory?: string;
  temperament: string[];
  goodWith: {
    children: boolean;
    otherDogs: boolean;
    otherCats: boolean;
    otherPets: boolean;
  };
  requirements: string[];
}

const CreateAdoptionPage: React.FC = () => {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [formData, setFormData] = useState<AdoptionForm>({
    petType: '',
    petBreed: '',
    petAge: '',
    petGender: 'unknown',
    petColor: '',
    petCategory: '',
    description: '',
    images: [], // Images are not required for now
    adoptionType: 'permanent',
    adoptionFee: undefined,
    isSpayedNeutered: false,
    isVaccinated: false,
    isMicrochipped: false,
    specialNeeds: '',
    medicalHistory: '',
    temperament: [],
    goodWith: {
      children: false,
      otherDogs: false,
      otherCats: false,
      otherPets: false,
    },
    requirements: [],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const temperamentOptions = [
    'Friendly',
    'Playful',
    'Calm',
    'Energetic',
    'Shy',
    'Confident',
    'Independent',
    'Affectionate',
    'Intelligent',
    'Curious',
    'Gentle',
    'Protective'
  ];

  const requirementOptions = [
    'Home visit required',
    'Vet reference required',
    'Personal reference required',
    'Fenced yard required',
    'No other pets',
    'Experienced owner required',
    'Children over 12 only',
    'No children',
    'Indoor only',
    'Outdoor access required'
  ];

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    
    if (type === 'checkbox') {
      if (name.startsWith('goodWith.')) {
        const field = name.split('.')[1] as keyof typeof formData.goodWith;
        setFormData(prev => ({
          ...prev,
          goodWith: {
            ...prev.goodWith,
            [field]: checked
          }
        }));
      } else if (name === 'isSpayedNeutered' || name === 'isVaccinated' || name === 'isMicrochipped') {
        setFormData(prev => ({
          ...prev,
          [name]: checked
        }));
      } else if (name === 'requirements') {
        setFormData(prev => ({
          ...prev,
          requirements: checked
            ? [...prev.requirements, value]
            : prev.requirements.filter(req => req !== value)
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleTemperamentChange = (temperament: string) => {
    setFormData(prev => ({
      ...prev,
      temperament: prev.temperament.includes(temperament)
        ? prev.temperament.filter(t => t !== temperament)
        : [...prev.temperament, temperament]
    }));
  };

  const handleRequirementChange = (requirement: string) => {
    setFormData(prev => ({
      ...prev,
      requirements: prev.requirements.includes(requirement)
        ? prev.requirements.filter(r => r !== requirement)
        : [...prev.requirements, requirement]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      console.log('Submitting adoption request with data:', formData);
      console.log('Required fields check:', {
        petType: !!formData.petType,
        description: !!formData.description,
        adoptionType: !!formData.adoptionType,
      });

      const response = await axios.post('/api/adoption', formData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      setSuccess('Adoption listing created successfully!');
      setTimeout(() => {
        router.push('/adoption');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create adoption listing');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Adoption Listing</h1>
            <p className="text-gray-600">Help a pet find their forever home by creating an adoption listing</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
              <p className="text-green-800">{success}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Pet Information */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Pet Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pet Type *
                  </label>
                  <select
                    name="petType"
                    value={formData.petType}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select pet type</option>
                    <option value="dog">Dog</option>
                    <option value="cat">Cat</option>
                    <option value="bird">Bird</option>
                    <option value="rabbit">Rabbit</option>
                    <option value="hamster">Hamster</option>
                    <option value="fish">Fish</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Breed
                  </label>
                  <input
                    type="text"
                    name="petBreed"
                    value={formData.petBreed}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Age
                  </label>
                  <input
                    type="text"
                    name="petAge"
                    value={formData.petAge}
                    onChange={handleInputChange}
                    placeholder="e.g., 2 years, 6 months"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gender
                  </label>
                  <select
                    name="petGender"
                    value={formData.petGender}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="unknown">Unknown</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Size
                  </label>
                  <select
                    name="petCategory"
                    value={formData.petCategory}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                    <option value="giant">Giant</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Color
                  </label>
                  <input
                    type="text"
                    name="petColor"
                    value={formData.petColor}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows={4}
                  placeholder="Describe the pet's personality, behavior, and any special characteristics..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Adoption Details */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Adoption Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Adoption Type *
                  </label>
                  <select
                    name="adoptionType"
                    value={formData.adoptionType}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="permanent">Permanent</option>
                    <option value="trial">Trial</option>
                    <option value="senior">Senior</option>
                    <option value="special-needs">Special Needs</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Adoption Fee ($)
                  </label>
                  <input
                    type="number"
                    name="adoptionFee"
                    value={formData.adoptionFee || ''}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Medical Status */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Medical Status</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="isSpayedNeutered"
                    checked={formData.isSpayedNeutered}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Spayed/Neutered</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="isVaccinated"
                    checked={formData.isVaccinated}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Vaccinated</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="isMicrochipped"
                    checked={formData.isMicrochipped}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Microchipped</span>
                </label>
              </div>

              <div className="mt-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Special Needs
                  </label>
                  <textarea
                    name="specialNeeds"
                    value={formData.specialNeeds}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="Any special medical needs, medications, or dietary requirements..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Medical History
                  </label>
                  <textarea
                    name="medicalHistory"
                    value={formData.medicalHistory}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="Previous medical conditions, surgeries, or treatments..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Temperament */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Temperament & Compatibility</h2>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Temperament (Select all that apply)
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {temperamentOptions.map((temperament) => (
                    <label key={temperament} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.temperament.includes(temperament)}
                        onChange={() => handleTemperamentChange(temperament)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">{temperament}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Good With
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="goodWith.otherDogs"
                      checked={formData.goodWith.otherDogs}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Dogs</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="goodWith.otherCats"
                      checked={formData.goodWith.otherCats}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Cats</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="goodWith.children"
                      checked={formData.goodWith.children}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Children</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="goodWith.otherPets"
                      checked={formData.goodWith.otherPets}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Other Pets</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Requirements */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Adoption Requirements</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {requirementOptions.map((requirement) => (
                  <label key={requirement} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.requirements.includes(requirement)}
                      onChange={() => handleRequirementChange(requirement)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">{requirement}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Creating...' : 'Create Adoption Listing'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateAdoptionPage;
