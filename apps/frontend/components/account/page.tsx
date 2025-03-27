"use client";
import React, { ChangeEvent, FormEvent, useState } from "react";

const ProfileInformationForm = () => {
  return (
    <div className='max-w-xl mx-auto p-6'>
      <h1 className='text-xl font-medium mb-2'>Profile Information</h1>
      <p className='text-gray-500 mb-6'>
        Update your account details and public profile
      </p>

      <form className='space-y-4'>
        <div className='grid grid-cols-2 gap-4'>
          <div>
            <label
              htmlFor='firstName'
              className='block text-sm font-medium text-gray-700 mb-1'
            >
              First Name
            </label>
            <input
              type='text'
              id='firstName'
              name='firstName'
              className='w-full px-3 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-gray-500'
              placeholder='john'
            />
          </div>
          <div>
            <label
              htmlFor='lastName'
              className='block text-sm font-medium text-gray-700 mb-1'
            >
              Last Name
            </label>
            <input
              type='text'
              id='lastName'
              name='lastName'
              className='w-full px-3 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-gray-500'
              placeholder='Doe'
            />
          </div>
        </div>

        <div>
          <label
            htmlFor='email'
            className='block text-sm font-medium text-gray-700 mb-1'
          >
            Email
          </label>
          <input
            type='email'
            id='email'
            name='email'
            className='w-full px-3 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-gray-500'
            placeholder='john.doe@example.com'
          />
        </div>

        <div>
          <label
            htmlFor='username'
            className='block text-sm font-medium text-gray-700 mb-1'
          >
            Username
          </label>
          <input
            type='text'
            id='username'
            name='username'
            className='w-full px-3 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-gray-500'
            placeholder='johndoe'
          />
        </div>

        <div>
          <label
            htmlFor='bio'
            className='block text-sm font-medium text-gray-700 mb-1'
          >
            Bio
          </label>
          <textarea
            id='bio'
            name='bio'
            className='w-full px-3 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-gray-500'
            placeholder='Tell us about yourself'
          />
        </div>

        <div className='flex justify-between pt-4'>
          <button
            type='button'
            className='px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500'
          >
            Cancel
          </button>
          <button
            type='submit'
            className='px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500'
          >
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProfileInformationForm;
