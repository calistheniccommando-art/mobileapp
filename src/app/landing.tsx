import { View, Text, ScrollView, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import {
  Dumbbell,
  Utensils,
  Timer,
  Target,
  ChevronRight,
  Star,
  CheckCircle,
} from 'lucide-react-native';
import { useSubscriptionStore } from '@/lib/state/subscription-store';

export default function LandingPage() {
  const router = useRouter();
  const markLandingSeen = useSubscriptionStore((s) => s.markLandingSeen);

  const handleGetStarted = () => {
    markLandingSeen();
    router.replace('/login');
  };

  const features = [
    {
      icon: Dumbbell,
      title: 'Personalized Workouts',
      description: 'AI-powered exercise plans tailored to your fitness level and goals',
    },
    {
      icon: Utensils,
      title: 'Nutrition Guidance',
      description: 'Custom meal plans designed around intermittent fasting',
    },
    {
      icon: Timer,
      title: 'Fasting Tracker',
      description: 'Built-in fasting timer with smart notifications',
    },
    {
      icon: Target,
      title: 'Progress Tracking',
      description: 'Visual progress charts and milestone celebrations',
    },
  ];

  const benefits = [
    'No gym equipment needed',
    'Suitable for all fitness levels',
    'Science-backed training methods',
    '12-week transformation program',
    'Daily workout & meal guidance',
    'Progress photos & measurements',
  ];

  const testimonials = [
    {
      name: 'Marcus T.',
      text: 'Lost 15kg in 12 weeks. The fasting schedule combined with the workouts was a game changer.',
      rating: 5,
    },
    {
      name: 'Sarah K.',
      text: 'Finally a program that fits my busy schedule. No gym, no excuses. Just results.',
      rating: 5,
    },
    {
      name: 'James R.',
      text: "The progressive workouts kept me challenged. Best fitness app I've ever used.",
      rating: 5,
    },
  ];

  return (
    <ScrollView className="flex-1 bg-slate-900" showsVerticalScrollIndicator={false}>
      {/* Hero Section */}
      <View className="relative min-h-[600px] w-full overflow-hidden">
        <LinearGradient
          colors={['#0f172a', '#1e293b', '#0f172a']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
        />

        {/* Decorative circles */}
        <View className="absolute -right-32 -top-32 h-64 w-64 rounded-full bg-emerald-500/10" />
        <View className="absolute -left-16 top-1/2 h-48 w-48 rounded-full bg-emerald-500/5" />

        <View className="mx-auto w-full max-w-6xl px-6 py-20">
          {/* Navigation */}
          <Animated.View
            entering={FadeIn.delay(100)}
            className="mb-16 flex-row items-center justify-between"
          >
            <View className="flex-row items-center gap-3">
              <View className="h-10 w-10 items-center justify-center rounded-xl bg-emerald-500">
                <Dumbbell size={20} color="white" />
              </View>
              <Text className="text-xl font-bold text-white">Calisthenic Commando</Text>
            </View>

            <Pressable onPress={handleGetStarted} className="rounded-full bg-emerald-500/20 px-6 py-2">
              <Text className="font-semibold text-emerald-400">Sign In</Text>
            </Pressable>
          </Animated.View>

          {/* Hero Content */}
          <View className="flex-row flex-wrap items-center">
            <View className="w-full pr-8 lg:w-1/2">
              <Animated.View entering={FadeInDown.delay(200).springify()}>
                <Text className="mb-2 font-semibold uppercase tracking-wider text-emerald-400">
                  Transform Your Body
                </Text>
                <Text className="mb-6 text-5xl font-bold leading-tight text-white">
                  Master Calisthenics{'\n'}
                  <Text className="text-emerald-400">Anywhere, Anytime</Text>
                </Text>
                <Text className="mb-8 text-lg leading-relaxed text-slate-300">
                  A complete 12-week transformation program combining bodyweight training and
                  intermittent fasting. No gym required. Just your body and dedication.
                </Text>
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(400).springify()} className="flex-row flex-wrap gap-4">
                <Pressable
                  onPress={handleGetStarted}
                  className="flex-row items-center gap-2 rounded-xl bg-emerald-500 px-8 py-4"
                >
                  <Text className="text-lg font-bold text-white">Get Started Free</Text>
                  <ChevronRight size={20} color="white" />
                </Pressable>

                <View className="flex-row items-center gap-2 px-4">
                  <View className="flex-row">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} size={16} color="#fbbf24" fill="#fbbf24" />
                    ))}
                  </View>
                  <Text className="text-slate-400">4.9 rating • 10K+ users</Text>
                </View>
              </Animated.View>
            </View>

            {/* Hero Image */}
            <Animated.View
              entering={FadeInDown.delay(300).springify()}
              className="mt-12 w-full lg:mt-0 lg:w-1/2"
            >
              <View className="relative mx-auto aspect-square max-w-md overflow-hidden rounded-3xl">
                <Image
                  source={{
                    uri: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&h=800&fit=crop',
                  }}
                  style={{ width: '100%', height: '100%' }}
                  contentFit="cover"
                />
                <LinearGradient
                  colors={['transparent', 'rgba(15, 23, 42, 0.8)']}
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: '50%',
                  }}
                />
                {/* Stats overlay */}
                <View className="absolute bottom-6 left-6 right-6 flex-row justify-between">
                  <View className="rounded-xl bg-slate-900/80 px-4 py-3">
                    <Text className="text-2xl font-bold text-emerald-400">12</Text>
                    <Text className="text-xs text-slate-400">Week Program</Text>
                  </View>
                  <View className="rounded-xl bg-slate-900/80 px-4 py-3">
                    <Text className="text-2xl font-bold text-emerald-400">100+</Text>
                    <Text className="text-xs text-slate-400">Exercises</Text>
                  </View>
                  <View className="rounded-xl bg-slate-900/80 px-4 py-3">
                    <Text className="text-2xl font-bold text-emerald-400">24/7</Text>
                    <Text className="text-xs text-slate-400">Support</Text>
                  </View>
                </View>
              </View>
            </Animated.View>
          </View>
        </View>
      </View>

      {/* Features Section */}
      <View className="bg-slate-800/50 py-20">
        <View className="mx-auto w-full max-w-6xl px-6">
          <Animated.View entering={FadeInDown.delay(100)} className="mb-12 items-center">
            <Text className="mb-2 font-semibold uppercase tracking-wider text-emerald-400">
              Everything You Need
            </Text>
            <Text className="text-center text-3xl font-bold text-white">
              Your Complete Fitness Solution
            </Text>
          </Animated.View>

          <View className="flex-row flex-wrap justify-center gap-6">
            {features.map((feature, index) => (
              <Animated.View
                key={feature.title}
                entering={FadeInDown.delay(200 + index * 100).springify()}
                className="w-full rounded-2xl border border-slate-700 bg-slate-800 p-6 sm:w-[calc(50%-12px)] lg:w-[calc(25%-18px)]"
              >
                <View className="mb-4 h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20">
                  <feature.icon size={24} color="#10b981" />
                </View>
                <Text className="mb-2 text-lg font-bold text-white">{feature.title}</Text>
                <Text className="text-sm leading-relaxed text-slate-400">{feature.description}</Text>
              </Animated.View>
            ))}
          </View>
        </View>
      </View>

      {/* Benefits Section */}
      <View className="py-20">
        <View className="mx-auto w-full max-w-6xl px-6">
          <View className="flex-row flex-wrap items-center">
            <View className="mb-12 w-full lg:mb-0 lg:w-1/2 lg:pr-12">
              <Animated.View entering={FadeInDown.delay(100)}>
                <Text className="mb-2 font-semibold uppercase tracking-wider text-emerald-400">
                  Why Choose Us
                </Text>
                <Text className="mb-6 text-3xl font-bold text-white">Built for Real Results</Text>
                <Text className="mb-8 text-lg text-slate-300">
                  Calisthenic Commando combines proven training methods with modern intermittent
                  fasting protocols to maximize your transformation.
                </Text>
              </Animated.View>

              <View className="gap-3">
                {benefits.map((benefit, index) => (
                  <Animated.View
                    key={benefit}
                    entering={FadeInDown.delay(200 + index * 50).springify()}
                    className="flex-row items-center gap-3"
                  >
                    <View className="h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20">
                      <CheckCircle size={14} color="#10b981" />
                    </View>
                    <Text className="text-slate-300">{benefit}</Text>
                  </Animated.View>
                ))}
              </View>
            </View>

            <Animated.View entering={FadeInDown.delay(300).springify()} className="w-full lg:w-1/2">
              <View className="overflow-hidden rounded-2xl">
                <Image
                  source={{
                    uri: 'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=800&h=600&fit=crop',
                  }}
                  style={{ width: '100%', aspectRatio: 4 / 3 }}
                  contentFit="cover"
                />
              </View>
            </Animated.View>
          </View>
        </View>
      </View>

      {/* Testimonials Section */}
      <View className="bg-slate-800/50 py-20">
        <View className="mx-auto w-full max-w-6xl px-6">
          <Animated.View entering={FadeInDown.delay(100)} className="mb-12 items-center">
            <Text className="mb-2 font-semibold uppercase tracking-wider text-emerald-400">
              Success Stories
            </Text>
            <Text className="text-center text-3xl font-bold text-white">
              Join Thousands of Transformations
            </Text>
          </Animated.View>

          <View className="flex-row flex-wrap justify-center gap-6">
            {testimonials.map((testimonial, index) => (
              <Animated.View
                key={testimonial.name}
                entering={FadeInDown.delay(200 + index * 100).springify()}
                className="w-full rounded-2xl border border-slate-700 bg-slate-800 p-6 sm:w-[calc(33.333%-16px)]"
              >
                <View className="mb-4 flex-row">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      size={16}
                      color={i <= testimonial.rating ? '#fbbf24' : '#475569'}
                      fill={i <= testimonial.rating ? '#fbbf24' : 'transparent'}
                    />
                  ))}
                </View>
                <Text className="mb-4 text-slate-300">"{testimonial.text}"</Text>
                <Text className="font-semibold text-white">{testimonial.name}</Text>
              </Animated.View>
            ))}
          </View>
        </View>
      </View>

      {/* CTA Section */}
      <View className="py-20">
        <View className="mx-auto w-full max-w-4xl px-6">
          <Animated.View
            entering={FadeInDown.delay(100).springify()}
            className="items-center overflow-hidden rounded-3xl"
          >
            <LinearGradient
              colors={['#059669', '#047857']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                width: '100%',
                padding: 48,
                alignItems: 'center',
              }}
            >
              <Text className="mb-4 text-center text-3xl font-bold text-white">
                Ready to Transform Your Body?
              </Text>
              <Text className="mb-8 max-w-lg text-center text-lg text-emerald-100">
                Start your 12-week journey today. No credit card required for the trial.
              </Text>
              <Pressable
                onPress={handleGetStarted}
                className="flex-row items-center gap-2 rounded-xl bg-white px-8 py-4"
              >
                <Text className="text-lg font-bold text-emerald-700">Start Your Transformation</Text>
                <ChevronRight size={20} color="#047857" />
              </Pressable>
            </LinearGradient>
          </Animated.View>
        </View>
      </View>

      {/* Footer */}
      <View className="border-t border-slate-800 py-12">
        <View className="mx-auto w-full max-w-6xl px-6">
          <View className="flex-row flex-wrap items-center justify-between">
            <View className="mb-6 flex-row items-center gap-3 lg:mb-0">
              <View className="h-8 w-8 items-center justify-center rounded-lg bg-emerald-500">
                <Dumbbell size={16} color="white" />
              </View>
              <Text className="font-bold text-white">Calisthenic Commando</Text>
            </View>

            <Text className="text-sm text-slate-500">
              © 2026 Calisthenic Commando. All rights reserved.
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
